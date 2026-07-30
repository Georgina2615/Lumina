import {
  collection,
  doc,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Define los estados actuales de las citas
export const appointmentStatus = Object.freeze({
  pending: 'por_confirmar',
  confirmed: 'confirmada',
  inCabin: 'en_cabina',
  checkout: 'por_cobrar',
  finalized: 'finalizada',
  cancelled: 'cancelada'
});
// Define las transiciones operativas actuales
const allowedTransitions = {
  [appointmentStatus.pending]: new Set([appointmentStatus.confirmed]),
  [appointmentStatus.confirmed]: new Set([appointmentStatus.inCabin]),
  [appointmentStatus.inCabin]: new Set([appointmentStatus.checkout])
};

// Define los estados que permiten cancelación
const cancellableStatuses = new Set([
  appointmentStatus.pending,
  appointmentStatus.confirmed
]);

// Valida la identidad del operador
const requireActor = (actorUid) => {
  // Detiene operaciones sin usuario
  if (!actorUid) {
    throw new Error('No se pudo identificar a la persona responsable');
  }
};

// Obtiene una cita dentro de una transacción
const requireAppointment = async (transaction, appointmentReference) => {
  // Lee el documento actual
  const appointmentSnapshot = await transaction.get(appointmentReference);

  // Detiene la operación si la cita no existe
  if (!appointmentSnapshot.exists()) {
    throw new Error('La cita ya no existe');
  }

  // Devuelve los datos vigentes
  return appointmentSnapshot.data();
};

// Crea un evento histórico
const createHistoryEvent = (
  transaction,
  appointmentReference,
  previousStatus,
  nextStatus,
  actorUid,
  reason,
  depositOutcome
) => {
  // Crea una referencia determinista para el evento
  const eventReference = doc(
    collection(appointmentReference, 'eventos'),
    nextStatus
  );

  transaction.set(eventReference, {
    tipo: 'cambio_estado',
    estadoAnterior: previousStatus,
    estadoNuevo: nextStatus,
    motivo: reason,
    anticipoResultado: depositOutcome,
    actorUid,
    fecha: serverTimestamp()
  });
};

// Comprueba si una cita puede cancelarse
export const canCancelAppointment = (appointment) => {
  // Devuelve la disponibilidad de cancelación
  return cancellableStatuses.has(appointment?.estado);
};

// Cambia el estado de una cita de forma atómica
export const transitionAppointmentStatus = async ({
  appointmentId,
  nextStatus,
  actorUid
}) => {
  requireActor(actorUid);

  // Define la referencia de la cita
  const appointmentReference = doc(db, 'citas', appointmentId);

  // Ejecuta la transición protegida
  return runTransaction(db, async (transaction) => {
    // Obtiene el estado vigente
    const appointment = await requireAppointment(transaction, appointmentReference);
    const previousStatus = appointment.estado;
    const validNextStatuses = allowedTransitions[previousStatus];

    // Detiene transiciones fuera del flujo
    if (!validNextStatuses?.has(nextStatus)) {
      throw new Error('La cita cambió de estado y la acción ya no es válida');
    }

    transaction.update(appointmentReference, {
      estado: nextStatus,
      actualizadaEn: serverTimestamp(),
      actualizadaPor: actorUid
    });
    createHistoryEvent(
      transaction,
      appointmentReference,
      previousStatus,
      nextStatus,
      actorUid,
      null,
      null
    );

    // Devuelve el estado confirmado
    return nextStatus;
  });
};

// Cancela una cita y conserva su historia
export const cancelAppointment = async ({
  appointmentId,
  reason,
  actorUid
}) => {
  requireActor(actorUid);

  // Normaliza el motivo capturado
  const normalizedReason = reason?.trim();

  // Detiene cancelaciones sin motivo suficiente
  if (!normalizedReason
    || normalizedReason.length < 5
    || normalizedReason.length > 500) {
    throw new Error('Escribe un motivo de entre cinco y quinientos caracteres');
  }
  // Define la referencia de la cita
  const appointmentReference = doc(db, 'citas', appointmentId);
  // Ejecuta la cancelación protegida
  return runTransaction(db, async (transaction) => {
    const appointment = await requireAppointment(transaction, appointmentReference);
    const slotReference = (typeof appointment.cupoId === 'string'
      && appointment.cupoId
      && !appointment.cupoId.includes('/'))
      ? doc(db, 'cupos', appointment.cupoId)
      : null;
    const slotSnapshot = slotReference ? await transaction.get(slotReference) : null;
    const usesManagedSlot = [1, 2, 3].includes(appointment.schemaVersion);

    // Detiene cancelaciones fuera del flujo
    if (!canCancelAppointment(appointment)) {
      throw new Error('Esta cita ya no admite cancelación');
    }
    if (usesManagedSlot && (
      !slotSnapshot?.exists()
      || slotSnapshot.data().citaId !== appointmentId
    )) {
      throw new Error('No se pudo comprobar el cupo de esta cita');
    }

    // Define el resultado real del anticipo
    const depositOutcome = appointment.anticipoPagado === true
      ? 'retenido'
      : 'no_aplica';

    transaction.update(appointmentReference, {
      estado: appointmentStatus.cancelled,
      actualizadaEn: serverTimestamp(),
      actualizadaPor: actorUid,
      'cancelacion.motivo': normalizedReason,
      'cancelacion.fecha': serverTimestamp(),
      'cancelacion.actorUid': actorUid,
      'cancelacion.anticipoResultado': depositOutcome
    });
    createHistoryEvent(
      transaction,
      appointmentReference,
      appointment.estado,
      appointmentStatus.cancelled,
      actorUid,
      normalizedReason,
      depositOutcome
    );

    if (
      usesManagedSlot
      && slotSnapshot?.exists()
      && slotSnapshot.data().citaId === appointmentId
    ) {
      transaction.delete(slotReference);
    }

    return depositOutcome;
  });
};
