import { FieldValue } from 'firebase-admin/firestore';
import {
  buildManagementEvent,
  buildManagementUpdate
} from './AppointmentManagementDocuments.js';
import {
  requireManagedAppointment,
  requireManagedSlot,
  requireManagementActor,
  requireManagementClientEmail
} from './AppointmentManagementStatePolicy.js';
import {
  requireExactManagementRetry
} from './AppointmentManagementRetryPolicy.js';

// Reconoce estados que liberan el horario
const releasesSlot = (status) => (
  ['cancelada', 'no_asistio'].includes(status)
);

// Construye la respuesta estable
const buildResult = (request) => ({
  appointmentId: request.appointmentId,
  status: request.status
});

// Ejecuta el cambio de estado de manera atomica
export const runAppointmentManagementTransaction = ({
  actorUid,
  firestore,
  now = new Date(),
  request,
  serverTimestamp = FieldValue.serverTimestamp
}) => firestore.runTransaction(async (transaction) => {
  // Identifica los documentos principales
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const appointmentReference = firestore
    .collection('citas')
    .doc(request.appointmentId);

  // Lee actor y cita antes de escribir
  const [
    actorSnapshot,
    appointmentSnapshot
  ] = await transaction.getAll(
    actorReference,
    appointmentReference
  );

  requireManagementActor(actorSnapshot);

  // Verifica el estado vigente de la cita
  const {
    appointment,
    isRetry
  } = requireManagedAppointment({
    now,
    request,
    snapshot: appointmentSnapshot
  });

  // Identifica el evento inmutable
  const eventReference = firestore
    .collection(`citas/${request.appointmentId}/eventos`)
    .doc(request.status);

  // Resuelve un reintento sin exigir el cupo eliminado
  if (isRetry) {
    const eventSnapshot = await transaction.get(eventReference);

    requireExactManagementRetry({
      actorUid,
      appointment,
      request,
      snapshot: eventSnapshot
    });

    return buildResult(request);
  }

  // Identifica el cupo relacionado
  const slotReference = firestore
    .collection('cupos')
    .doc(appointment.cupoId);

  // Identifica el cliente cuando confirma por correo
  const clientReference = (
    request.action === 'confirmar'
    && request.channel === 'correo'
  )
    ? firestore.collection('clientes').doc(appointment.clienteId)
    : null;

  // Reune las lecturas restantes
  const remainingReferences = [
    slotReference,
    ...(clientReference ? [clientReference] : [])
  ];

  // Obtiene el cupo y el posible cliente
  const [
    slotSnapshot,
    clientSnapshot
  ] = await transaction.getAll(...remainingReferences);

  requireManagedSlot({
    appointmentId: request.appointmentId,
    snapshot: slotSnapshot
  });

  // Verifica el correo usado al confirmar
  if (clientReference) {
    requireManagementClientEmail(clientSnapshot);
  }

  // Obtiene una marca temporal unica
  const timestamp = serverTimestamp();

  // Construye el cambio persistente
  const update = buildManagementUpdate({
    actorUid,
    appointment,
    request,
    timestamp
  });

  // Actualiza la cita y registra su historia
  transaction.update(appointmentReference, update);
  transaction.create(
    eventReference,
    buildManagementEvent({
      actorUid,
      previousStatus: appointment.estado,
      request,
      timestamp,
      update
    })
  );

  // Libera únicamente estados terminales
  if (releasesSlot(request.status)) {
    transaction.delete(slotReference);
  }

  // Devuelve el resultado operativo
  return buildResult(request);
});
