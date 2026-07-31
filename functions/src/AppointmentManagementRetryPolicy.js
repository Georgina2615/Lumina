import { AppointmentError } from './AppointmentError.js';
import {
  NO_SHOW_TOLERANCE_MINUTES
} from './AppointmentManagementStatePolicy.js';

// Lanza el error estable de reintento
const failRetry = () => {
  throw new AppointmentError(
    'failed-precondition',
    'La cita ya fue actualizada'
  );
};

// Compara marcas temporales equivalentes
const hasSameTimestamp = (first, second) => {
  // Compara marcas reales de Firestore
  if (
    typeof first?.toMillis === 'function'
    && typeof second?.toMillis === 'function'
  ) {
    return first.toMillis() === second.toMillis();
  }

  // Compara valores deterministas de prueba
  return first === second;
};

// Verifica la identidad del evento
const hasMatchingEvent = ({
  actorUid,
  appointment,
  event,
  request
}) => (
  event?.tipo === 'cambio_estado'
  && event.accion === request.action
  && event.estadoNuevo === request.status
  && event.actorUid === actorUid
  && event.canal === request.channel
  && event.origen === request.origin
  && event.motivo === request.reason
  && appointment.actualizadaPor === actorUid
  && hasSameTimestamp(event.fecha, appointment.actualizadaEn)
);

// Verifica los metadatos de confirmacion
const hasMatchingConfirmation = ({
  actorUid,
  appointment,
  request
}) => (
  appointment.confirmacion?.actorUid === actorUid
  && appointment.confirmacion?.canal === request.channel
  && appointment.confirmacion?.origen === 'recepcion'
);

// Verifica los metadatos de cancelacion
const hasMatchingCancellation = ({
  actorUid,
  appointment,
  event,
  request
}) => (
  appointment.cancelacion?.actorUid === actorUid
  && appointment.cancelacion?.origen === request.origin
  && appointment.cancelacion?.motivo === request.reason
  && appointment.cancelacion?.anticipoResultado
    === event.anticipoResultado
);

// Verifica los metadatos de inasistencia
const hasMatchingNoShow = ({
  actorUid,
  appointment,
  event,
  request
}) => (
  appointment.inasistencia?.actorUid === actorUid
  && appointment.inasistencia?.motivo === request.reason
  && appointment.inasistencia?.toleranciaMinutos
    === NO_SHOW_TOLERANCE_MINUTES
  && appointment.inasistencia?.anticipoResultado
    === event.anticipoResultado
);

// Verifica un reintento exacto
export const requireExactManagementRetry = ({
  actorUid,
  appointment,
  request,
  snapshot
}) => {
  // Obtiene el evento inmutable
  const event = snapshot?.exists ? snapshot.data() : null;
  const context = {
    actorUid,
    appointment,
    event,
    request
  };

  // Verifica la intención y la autoria
  if (!hasMatchingEvent(context)) {
    failRetry();
  }

  // Verifica la confirmacion registrada
  if (
    request.action === 'confirmar'
    && !hasMatchingConfirmation(context)
  ) {
    failRetry();
  }

  // Verifica la cancelacion registrada
  if (
    request.action === 'cancelar'
    && !hasMatchingCancellation(context)
  ) {
    failRetry();
  }

  // Verifica la inasistencia registrada
  if (
    request.action === 'marcar_no_asistio'
    && !hasMatchingNoShow(context)
  ) {
    failRetry();
  }
};

