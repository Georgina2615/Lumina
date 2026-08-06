import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import {
  buildAppointmentSlotId
} from './AppointmentSchedulePolicy.js';
import { requireAppointmentService } from './AppointmentStoredPolicy.js';
import {
  buildPublicContactLockDocument,
  buildPublicRequestDocument,
  buildPublicReservationDocument
} from './PublicAppointmentDocuments.js';
import {
  validatePublicAppointmentRequest
} from './PublicAppointmentPolicy.js';

// Convierte errores de la solicitud publica
const mapError = (error) => error instanceof AppointmentError
  ? new HttpsError(error.code, error.message)
  : new HttpsError('internal', 'No se pudo enviar la solicitud');

// Crea todas las referencias estables
const buildReferences = ({ firestore, request }) => {
  const publicRequest = firestore.collection('solicitudesCitaPublica').doc();
  const slotId = buildAppointmentSlotId(request.interval);
  return {
    publicRequest,
    service: firestore.collection('servicios').doc(request.serviceId),
    slot: firestore.collection('cupos').doc(slotId),
    reservation: firestore.collection('reservasPublicas').doc(slotId),
    contactLock: firestore.collection('solicitudesCitaPublica')
      .doc('control')
      .collection('contactos')
      .doc(request.contactKey)
  };
};

// Guarda la solicitud y bloquea el horario
const createPublicRequest = async ({
  firestore,
  proofPath,
  references,
  request,
  serverTimestamp,
  toTimestamp
}) => firestore.runTransaction(async (transaction) => {
  const [serviceSnapshot, slotSnapshot, reservationSnapshot, lockSnapshot] = (
    await transaction.getAll(
      references.service,
      references.slot,
      references.reservation,
      references.contactLock
    )
  );
  const service = requireAppointmentService(serviceSnapshot);
  if (slotSnapshot.exists || reservationSnapshot.exists) {
    throw new AppointmentError(
      'already-exists',
      'El horario acaba de ser ocupado'
    );
  }
  if (lockSnapshot.exists && lockSnapshot.data().active === true) {
    throw new AppointmentError(
      'already-exists',
      'Ya existe una solicitud activa con estos datos de contacto'
    );
  }

  const depositAmountCents = Math.round(
    service.priceCents * service.depositPercentage / 100
  );
  const timestamp = serverTimestamp();
  transaction.create(references.publicRequest, buildPublicRequestDocument({
    client: request.client,
    contactKey: request.contactKey,
    depositAmountCents,
    interval: request.interval,
    paymentReference: request.paymentReference,
    proofPath,
    requestId: references.publicRequest.id,
    service,
    timestamp,
    toTimestamp
  }));
  transaction.create(references.reservation, buildPublicReservationDocument({
    interval: request.interval,
    requestId: references.publicRequest.id,
    timestamp,
    toTimestamp
  }));
  transaction.set(references.contactLock, buildPublicContactLockDocument({
    requestId: references.publicRequest.id,
    timestamp
  }));

  return {
    requestId: references.publicRequest.id,
    status: 'pending_review',
    depositAmountCents
  };
});

// Recibe una solicitud publica protegida
export const submitPublicAppointmentRequestHandler = async ({
  data,
  firestore,
  storage,
  now = new Date(),
  serverTimestamp = FieldValue.serverTimestamp,
  toTimestamp = Timestamp.fromDate
}) => {
  let file;
  let request;
  try {
    request = validatePublicAppointmentRequest(data, now);
    const references = buildReferences({ firestore, request });
    const proofPath = `comprobantes-anticipos-publicos/${references.publicRequest.id}/comprobante.webp`;
    file = storage.bucket().file(proofPath);
    await file.save(request.proof, {
      resumable: false,
      metadata: {
        cacheControl: 'private, no-store',
        contentType: 'image/webp'
      }
    });
    return await createPublicRequest({
      firestore,
      proofPath,
      references,
      request,
      serverTimestamp,
      toTimestamp
    });
  } catch (error) {
    if (file) {
      await file.delete({ ignoreNotFound: true }).catch(() => null);
    }
    const mappedError = mapError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado en solicitud publica', {
        errorCode: error?.code ?? null,
        errorName: error?.name ?? 'Error',
        serviceId: request?.serviceId ?? null
      });
    }
    throw mappedError;
  }
};
