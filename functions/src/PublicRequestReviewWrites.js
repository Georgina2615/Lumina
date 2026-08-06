import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { AppointmentError } from './AppointmentError.js';
import {
  buildAppointmentDocument,
  buildAppointmentPaymentDocument,
  buildAppointmentSlotDocument
} from './AppointmentDocuments.js';

// Construye el anticipo por transferencia
const buildPublicDeposit = (publicRequest) => {
  const amountCents = publicRequest.serviceSnapshot.depositAmountCents;
  return {
    method: 'transferencia',
    amountCents,
    payments: [{
      method: 'transferencia',
      amountCents,
      cashReceivedCents: 0,
      changeCents: 0,
      reference: publicRequest.paymentReference,
      cardLastFour: ''
    }]
  };
};

// Libera los bloqueos temporales de la solicitud
const releaseTemporaryLocks = ({
  transaction,
  references,
  lockSnapshot,
  reservationSnapshot
}) => {
  if (reservationSnapshot.exists) {
    transaction.delete(references.reservation);
  }
  if (lockSnapshot.exists) {
    transaction.update(references.contactLock, {
      active: false,
      releasedAt: FieldValue.serverTimestamp()
    });
  }
};

// Rechaza una solicitud y conserva su historial
export const rejectPublicRequest = ({
  actorUid,
  command,
  requestReference,
  transaction,
  references,
  lockSnapshot,
  reservationSnapshot
}) => {
  if (
    reservationSnapshot.exists
    && reservationSnapshot.data().requestId !== command.requestId
  ) {
    throw new AppointmentError(
      'failed-precondition',
      'La reserva pertenece a otra solicitud'
    );
  }
  if (
    lockSnapshot.exists
    && lockSnapshot.data().requestId !== command.requestId
  ) {
    throw new AppointmentError(
      'failed-precondition',
      'El contacto pertenece a otra solicitud'
    );
  }

  const timestamp = FieldValue.serverTimestamp();
  transaction.update(requestReference, {
    status: 'rejected',
    review: {
      actorUid,
      reason: command.reason,
      reviewedAt: timestamp
    },
    updatedAt: timestamp
  });
  releaseTemporaryLocks({
    transaction,
    references,
    lockSnapshot,
    reservationSnapshot
  });
  return {
    requestId: command.requestId,
    status: 'rejected',
    appointmentId: null,
    clientId: null,
    alreadyProcessed: false
  };
};

// Aprueba una solicitud y crea la cita real
export const approvePublicRequest = ({
  actorUid,
  client,
  clientReference,
  command,
  firestore,
  lockSnapshot,
  publicRequest,
  references,
  reservationSnapshot,
  service,
  transaction
}) => {
  const timestamp = FieldValue.serverTimestamp();
  const deposit = buildPublicDeposit(publicRequest);
  const payment = firestore.collection('pagos')
    .doc(`${references.appointment.id}_anticipo`);

  transaction.create(references.appointment, buildAppointmentDocument({
    actorUid,
    client,
    clientId: clientReference.id,
    contactChannel: 'correo',
    deposit,
    interval: publicRequest.interval,
    service,
    slotId: publicRequest.slotId,
    timestamp,
    toTimestamp: Timestamp.fromDate
  }));
  transaction.create(references.slot, buildAppointmentSlotDocument({
    actorUid,
    appointmentId: references.appointment.id,
    clientId: clientReference.id,
    interval: publicRequest.interval,
    service,
    timestamp,
    toTimestamp: Timestamp.fromDate
  }));
  transaction.create(payment, buildAppointmentPaymentDocument({
    actorUid,
    appointmentId: references.appointment.id,
    clientId: clientReference.id,
    deposit,
    timestamp
  }));
  transaction.update(
    firestore.collection('solicitudesCitaPublica').doc(command.requestId),
    {
      status: 'approved',
      appointmentId: references.appointment.id,
      clientId: clientReference.id,
      review: { actorUid, reason: '', reviewedAt: timestamp },
      updatedAt: timestamp
    }
  );
  releaseTemporaryLocks({
    transaction,
    references,
    lockSnapshot,
    reservationSnapshot
  });

  return {
    requestId: command.requestId,
    status: 'approved',
    appointmentId: references.appointment.id,
    clientId: clientReference.id,
    alreadyProcessed: false
  };
};
