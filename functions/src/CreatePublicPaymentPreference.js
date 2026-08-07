import { randomBytes } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import { requireAppointmentService } from './AppointmentStoredPolicy.js';
import { createMercadoPagoPreference } from './MercadoPagoClient.js';
import {
  buildPublicPaymentContactLock,
  buildPublicPaymentReservationDocument,
  buildPublicPaymentSessionDocument
} from './PublicPaymentDocuments.js';
import {
  hashPublicPaymentAccessKey,
  PUBLIC_PAYMENT_MINUTES,
  PUBLIC_RESERVATION_MINUTES,
  validatePublicPaymentRequest
} from './PublicPaymentPolicy.js';

const WEBHOOK_URL = 'https://us-central1-lumina-f247c.cloudfunctions.net/mercadoPagoWebhook';

// Convierte errores del cobro en mensajes públicos
const mapError = (error) => error instanceof AppointmentError
  ? new HttpsError(error.code, error.message)
  : new HttpsError('internal', 'No se pudo preparar el pago');

// Obtiene una fecha persistida cuando existe
const getStoredDate = (value) => (
  typeof value?.toDate === 'function' ? value.toDate() : null
);

// Comprueba si un bloqueo temporal sigue vigente
const isActiveReservation = (snapshot, now) => {
  if (!snapshot.exists) return false;
  const data = snapshot.data();
  if (data.status === 'pending_review') return true;
  const expiresAt = getStoredDate(data.expiresAt);
  return data.status === 'pending_payment'
    && expiresAt
    && expiresAt.getTime() > now.getTime();
};

// Comprueba si un contacto conserva una reservación vigente
const isActiveContact = (snapshot, now) => {
  if (!snapshot.exists || snapshot.data().active !== true) return false;
  if (snapshot.data().requestId) return true;
  const expiresAt = getStoredDate(snapshot.data().expiresAt);
  return Boolean(expiresAt && expiresAt.getTime() > now.getTime());
};

// Reserva el horario antes de contactar al proveedor
const createPaymentSession = ({
  accessKeyHash,
  firestore,
  now,
  request,
  serverTimestamp,
  sessionReference,
  toTimestamp
}) => firestore.runTransaction(async (transaction) => {
  const serviceReference = firestore.collection('servicios').doc(request.serviceId);
  const slotReference = firestore.collection('cupos').doc(request.slotId);
  const reservationReference = firestore.collection('reservasPublicas').doc(request.slotId);
  const contactReference = firestore.collection('solicitudesCitaPublica')
    .doc('control').collection('contactos').doc(request.contactKey);
  const [serviceSnapshot, slotSnapshot, reservationSnapshot, contactSnapshot] = (
    await transaction.getAll(
      serviceReference,
      slotReference,
      reservationReference,
      contactReference
    )
  );
  const service = requireAppointmentService(serviceSnapshot);
  if (slotSnapshot.exists || isActiveReservation(reservationSnapshot, now)) {
    throw new AppointmentError('already-exists', 'El horario acaba de ser ocupado');
  }
  if (isActiveContact(contactSnapshot, now)) {
    throw new AppointmentError(
      'already-exists',
      'Ya existe una reservación activa con estos datos de contacto'
    );
  }

  const timestamp = serverTimestamp();
  const reservationExpiresAt = new Date(
    now.getTime() + PUBLIC_RESERVATION_MINUTES * 60 * 1000
  );
  const depositAmountCents = Math.round(
    service.priceCents * service.depositPercentage / 100
  );
  transaction.set(sessionReference, buildPublicPaymentSessionDocument({
    accessKeyHash,
    client: request.client,
    contactKey: request.contactKey,
    depositAmountCents,
    interval: request.interval,
    reservationExpiresAt,
    service,
    sessionId: sessionReference.id,
    slotId: request.slotId,
    timestamp,
    toTimestamp
  }));
  transaction.set(reservationReference, buildPublicPaymentReservationDocument({
    expiresAt: reservationExpiresAt,
    interval: request.interval,
    sessionId: sessionReference.id,
    timestamp,
    toTimestamp
  }));
  transaction.set(contactReference, buildPublicPaymentContactLock({
    expiresAt: reservationExpiresAt,
    sessionId: sessionReference.id,
    timestamp,
    toTimestamp
  }));
  return { contactReference, depositAmountCents, reservationReference, service };
});

// Libera una sesión cuyo enlace no pudo crearse
const releaseFailedSession = ({ firestore, references, sessionReference }) => (
  firestore.runTransaction(async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionReference);
    if (!sessionSnapshot.exists || sessionSnapshot.data().status !== 'pending_payment') return;
    transaction.update(sessionReference, {
      status: 'preference_failed',
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.delete(references.reservationReference);
    transaction.update(references.contactReference, {
      active: false,
      releasedAt: FieldValue.serverTimestamp()
    });
  })
);

// Crea el enlace seguro para pagar el anticipo
export const createPublicPaymentPreferenceHandler = async ({
  accessToken,
  data,
  firestore,
  now = new Date(),
  serverTimestamp = FieldValue.serverTimestamp,
  toTimestamp = Timestamp.fromDate
}) => {
  let request;
  let references;
  const sessionReference = firestore.collection('sesionesPagoPublicas').doc();
  const accessKey = randomBytes(32).toString('hex');
  try {
    request = validatePublicPaymentRequest(data, now);
    references = await createPaymentSession({
      accessKeyHash: hashPublicPaymentAccessKey(accessKey),
      firestore,
      now,
      request,
      serverTimestamp,
      sessionReference,
      toTimestamp
    });
    const paymentExpiresAt = new Date(
      now.getTime() + PUBLIC_PAYMENT_MINUTES * 60 * 1000
    );
    const returnUrl = `${request.returnOrigin}/agendar?payment_session=${sessionReference.id}&payment_key=${accessKey}`;
    const preference = await createMercadoPagoPreference({
      accessToken,
      depositAmountCents: references.depositAmountCents,
      expiresAt: paymentExpiresAt,
      notificationUrl: WEBHOOK_URL,
      returnUrl,
      service: references.service,
      sessionId: sessionReference.id
    });
    const checkoutUrl = accessToken.startsWith('TEST-')
      ? preference.sandbox_init_point
      : preference.init_point;
    if (!preference.id || !checkoutUrl) {
      throw new AppointmentError('unavailable', 'Mercado Pago no devolvió un enlace válido');
    }
    await sessionReference.update({
      preferenceId: String(preference.id),
      checkoutUrl,
      paymentExpiresAt: toTimestamp(paymentExpiresAt),
      updatedAt: serverTimestamp()
    });
    return {
      checkoutUrl,
      sessionId: sessionReference.id,
      accessKey,
      depositAmountCents: references.depositAmountCents
    };
  } catch (error) {
    if (references) {
      await releaseFailedSession({ firestore, references, sessionReference })
        .catch(() => null);
    }
    const mappedError = mapError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al preparar Mercado Pago', {
        errorName: error?.name ?? 'Error',
        serviceId: request?.serviceId ?? null
      });
    }
    throw mappedError;
  }
};
