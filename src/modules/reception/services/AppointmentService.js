import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Define los estados actuales de las citas
export const appointmentStatus = Object.freeze({
  pending: 'por_confirmar',
  confirmed: 'confirmada',
  inCabin: 'en_cabina',
  completedLegacy: 'completada',
  finalized: 'finalizada',
  cancelled: 'cancelada'
});

// Define las transiciones operativas actuales
const allowedTransitions = {
  [appointmentStatus.pending]: new Set([appointmentStatus.confirmed]),
  [appointmentStatus.confirmed]: new Set([appointmentStatus.inCabin]),
  [appointmentStatus.inCabin]: new Set([appointmentStatus.completedLegacy])
};

// Define los estados que permiten cancelación
const cancellableStatuses = new Set([
  appointmentStatus.pending,
  appointmentStatus.confirmed
]);

// Ordena las citas por fecha y hora
const sortAppointments = (appointments) => {
  // Devuelve las citas ordenadas
  return [...appointments].sort((first, second) => {
    // Crea la clave de la primera cita
    const firstKey = `${first.fecha ?? ''} ${first.hora ?? ''}`;
    const secondKey = `${second.fecha ?? ''} ${second.hora ?? ''}`;

    // Devuelve la comparación de las claves
    return firstKey.localeCompare(secondKey);
  });
};

// Convierte documentos en citas
const mapSnapshot = (snapshot) => {
  // Crea la lista de citas
  const appointments = snapshot.docs.map((documentSnapshot) => {
    // Obtiene los datos vigentes
    const appointment = documentSnapshot.data();

    // Devuelve la cita con sus capacidades
    return {
      id: documentSnapshot.id,
      ...appointment,
      canCancel: cancellableStatuses.has(appointment.estado)
    };
  });

  // Devuelve la lista ordenada
  return sortAppointments(appointments);
};

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

// Formatea una fecha local para Firestore
export const formatDateKey = (date) => {
  // Obtiene las partes de la fecha
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Devuelve la fecha normalizada
  return `${year}-${month}-${day}`;
};

// Comprueba si una cita puede cancelarse
export const canCancelAppointment = (appointment) => {
  // Devuelve la disponibilidad de cancelación
  return cancellableStatuses.has(appointment?.estado);
};

// Escucha una columna del tablero
export const subscribeAppointmentsByStatus = ({
  status,
  dateKey,
  onData,
  onError
}) => {
  // Define los filtros de la consulta
  const constraints = [where('estado', '==', status)];

  // Agrega el filtro diario cuando corresponde
  if (dateKey) {
    constraints.push(where('fecha', '==', dateKey));
  }

  // Construye la consulta de citas
  const appointmentsQuery = query(collection(db, 'citas'), ...constraints);

  // Devuelve la cancelación del listener
  return onSnapshot(
    appointmentsQuery,
    (snapshot) => onData(mapSnapshot(snapshot)),
    onError
  );
};

// Escucha las citas del rango visible
export const subscribeCalendarAppointments = ({
  startDateKey,
  endDateKey,
  onData,
  onError
}) => {
  // Construye la consulta por rango
  const appointmentsQuery = query(
    collection(db, 'citas'),
    where('fecha', '>=', startDateKey),
    where('fecha', '<=', endDateKey)
  );

  // Devuelve la cancelación del listener
  return onSnapshot(
    appointmentsQuery,
    (snapshot) => onData(mapSnapshot(snapshot)),
    onError
  );
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
  if (
    !normalizedReason
    || normalizedReason.length < 5
    || normalizedReason.length > 500
  ) {
    throw new Error('Escribe un motivo de entre cinco y quinientos caracteres');
  }

  // Define la referencia de la cita
  const appointmentReference = doc(db, 'citas', appointmentId);

  // Ejecuta la cancelación protegida
  return runTransaction(db, async (transaction) => {
    // Obtiene la cita vigente
    const appointment = await requireAppointment(transaction, appointmentReference);

    // Detiene cancelaciones fuera del flujo
    if (!canCancelAppointment(appointment)) {
      throw new Error('Esta cita ya no admite cancelación');
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

    // Devuelve el resultado financiero registrado
    return depositOutcome;
  });
};
