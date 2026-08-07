import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  buildAppointmentClientDocument,
  buildAppointmentIdentityDocument,
  buildAppointmentDocument,
  buildAppointmentPaymentDocument,
  buildAppointmentSlotDocument
} from './AppointmentDocuments.js';
import {
  buildClientIdentities,
  normalizeAppointmentClient,
  requireStoredIdentity
} from './AppointmentClientPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import { buildAppointmentInterval } from './AppointmentSchedulePolicy.js';
import {
  requireAppointmentService,
  resolveAppointmentClientId
} from './AppointmentStoredPolicy.js';
import {
  requireMatchingPublicService,
  requirePublicStoredClient
} from './PublicRequestReviewPolicy.js';
import { buildMercadoPagoDeposit } from './PublicPaymentPolicy.js';

// Lanza un error conocido de persistencia
const fail = (message) => {
  throw new AppointmentError('failed-precondition', message);
};

// Convierte una marca persistida en fecha
const requireDate = (value) => {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value;
  if (!date || Number.isNaN(date.getTime())) fail('La reservación no tiene un horario válido');
  return date;
};

// Valida la fotografía de la sesión de pago
const requirePaymentSession = ({ sessionId, snapshot }) => {
  if (!snapshot.exists || snapshot.data().sessionId !== sessionId) {
    fail('La reservación de pago no existe');
  }
  const data = snapshot.data();
  if (data.status === 'approved' && data.appointmentId) {
    return { alreadyProcessed: true, ...data };
  }
  if (data.status === 'payment_needs_attention') {
    return { needsAttention: true, ...data };
  }
  if (!['pending_payment', 'payment_pending', 'payment_rejected'].includes(data.status)) {
    fail('La reservación ya no puede recibir este pago');
  }
  const client = normalizeAppointmentClient({ id: null, ...data.client });
  const interval = buildAppointmentInterval({
    dateKey: data.schedule?.dateKey,
    time: data.schedule?.time,
    enforceMinimumNotice: false
  });
  if (
    requireDate(data.schedule?.start).getTime() !== interval.start.getTime()
    || requireDate(data.schedule?.blockEnd).getTime() !== interval.blockEnd.getTime()
  ) {
    fail('El horario reservado no coincide');
  }
  return {
    alreadyProcessed: false,
    accessKeyHash: data.accessKeyHash,
    client,
    contactKey: data.contactKey,
    identities: buildClientIdentities(client),
    interval,
    serviceSnapshot: data.service,
    serviceId: data.service?.id,
    slotId: data.slotId
  };
};

// Construye las referencias de una cita pagada
const buildReferences = ({ firestore, session }) => ({
  appointment: firestore.collection('citas').doc(),
  client: firestore.collection('clientes').doc(),
  payment: firestore.collection('pagos').doc(),
  providerPayment: firestore.collection('pagosMercadoPago').doc(),
  service: firestore.collection('servicios').doc(session.serviceId),
  slot: firestore.collection('cupos').doc(session.slotId),
  reservation: firestore.collection('reservasPublicas').doc(session.slotId),
  contactLock: firestore.collection('solicitudesCitaPublica')
    .doc('control').collection('contactos').doc(session.contactKey),
  identities: session.identities.map((identity) => ({
    identity,
    reference: firestore.collection('identidadesClientes').doc(identity.id)
  }))
});

// Libera los bloqueos temporales correspondientes
const releasePaymentLocks = ({
  contactSnapshot,
  references,
  reservationSnapshot,
  sessionId,
  transaction
}) => {
  if (reservationSnapshot.exists && reservationSnapshot.data().sessionId === sessionId) {
    transaction.delete(references.reservation);
  }
  if (contactSnapshot.exists && contactSnapshot.data().sessionId === sessionId) {
    transaction.update(references.contactLock, {
      active: false,
      releasedAt: FieldValue.serverTimestamp()
    });
  }
};

// Convierte un pago aprobado en una cita completa
export const finalizePublicPayment = ({
  firestore,
  payment,
  sessionId
}) => firestore.runTransaction(async (transaction) => {
  const sessionReference = firestore.collection('sesionesPagoPublicas').doc(sessionId);
  const sessionSnapshot = await transaction.get(sessionReference);
  const session = requirePaymentSession({ sessionId, snapshot: sessionSnapshot });
  if (session.alreadyProcessed) {
    return { appointmentId: session.appointmentId, status: 'approved' };
  }
  if (session.needsAttention) {
    return { appointmentId: null, status: 'needs_attention' };
  }
  if (String(payment?.external_reference ?? '') !== sessionId) {
    fail('El pago no corresponde con esta reservación');
  }
  const deposit = buildMercadoPagoDeposit({
    payment,
    requiredCents: session.serviceSnapshot?.depositAmountCents
  });
  const references = buildReferences({ firestore, session });
  references.payment = firestore.collection('pagos')
    .doc(`${references.appointment.id}_anticipo`);
  references.providerPayment = firestore.collection('pagosMercadoPago')
    .doc(deposit.paymentId);
  const snapshots = await transaction.getAll(
    references.service,
    references.slot,
    references.reservation,
    references.contactLock,
    references.providerPayment,
    ...references.identities.map(({ reference }) => reference)
  );
  const [
    serviceSnapshot,
    slotSnapshot,
    reservationSnapshot,
    contactSnapshot,
    providerPaymentSnapshot,
    ...identitySnapshots
  ] = snapshots;
  if (providerPaymentSnapshot.exists) {
    fail('Este pago ya fue utilizado');
  }
  if (slotSnapshot.exists) {
    transaction.update(sessionReference, {
      status: 'payment_needs_attention',
      paymentId: deposit.paymentId,
      updatedAt: FieldValue.serverTimestamp()
    });
    return { appointmentId: null, status: 'needs_attention' };
  }

  const service = requireAppointmentService(serviceSnapshot);
  requireMatchingPublicService({ service, stored: session.serviceSnapshot });
  const owners = identitySnapshots.map((snapshot, index) => requireStoredIdentity({
    identity: references.identities[index].identity,
    snapshot
  }));
  const existingClientId = resolveAppointmentClientId({
    requestedClientId: null,
    identityOwners: owners
  });
  const clientReference = existingClientId
    ? firestore.collection('clientes').doc(existingClientId)
    : references.client;
  const clientSnapshot = existingClientId
    ? await transaction.get(clientReference)
    : null;
  const client = existingClientId
    ? requirePublicStoredClient({ snapshot: clientSnapshot, requestedClient: session.client })
    : session.client;
  const actorUid = 'mercado_pago';
  const timestamp = FieldValue.serverTimestamp();

  if (!existingClientId) {
    transaction.create(clientReference, buildAppointmentClientDocument({
      actorUid,
      client,
      timestamp
    }));
  }
  references.identities.forEach(({ identity, reference }, index) => {
    if (!owners[index]) {
      transaction.create(reference, buildAppointmentIdentityDocument({
        actorUid,
        clientId: clientReference.id,
        identity,
        timestamp
      }));
    }
  });

  transaction.create(references.appointment, buildAppointmentDocument({
    actorUid,
    client,
    clientId: clientReference.id,
    contactChannel: 'correo',
    deposit,
    interval: session.interval,
    service,
    slotId: session.slotId,
    timestamp,
    toTimestamp: Timestamp.fromDate
  }));
  transaction.create(references.slot, buildAppointmentSlotDocument({
    actorUid,
    appointmentId: references.appointment.id,
    clientId: clientReference.id,
    interval: session.interval,
    service,
    timestamp,
    toTimestamp: Timestamp.fromDate
  }));
  transaction.create(references.payment, {
    ...buildAppointmentPaymentDocument({
      actorUid,
      appointmentId: references.appointment.id,
      clientId: clientReference.id,
      deposit,
      timestamp
    }),
    proveedor: {
      nombre: 'mercado_pago',
      pagoId: deposit.paymentId,
      estado: 'approved'
    }
  });
  transaction.create(references.providerPayment, {
    schemaVersion: 1,
    sessionId,
    appointmentId: references.appointment.id,
    paymentId: deposit.paymentId,
    amountCents: deposit.amountCents,
    createdAt: timestamp
  });
  transaction.update(sessionReference, {
    status: 'approved',
    appointmentId: references.appointment.id,
    clientId: clientReference.id,
    paymentId: deposit.paymentId,
    paidAt: timestamp,
    updatedAt: timestamp
  });
  releasePaymentLocks({
    contactSnapshot,
    references,
    reservationSnapshot,
    sessionId,
    transaction
  });
  return { appointmentId: references.appointment.id, status: 'approved' };
});
