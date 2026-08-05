import { AppointmentError } from './AppointmentError.js';

// Define la tolerancia previa a una inasistencia
export const NO_SHOW_TOLERANCE_MINUTES = 15;

// Define la anticipacion para entrar a cabina
export const CABIN_ADVANCE_MINUTES = 30;

// Define los estados de origen permitidos
const allowedPreviousStatuses = Object.freeze({
  confirmar: ['por_confirmar'],
  enviar_cabina: ['confirmada'],
  cancelar: ['por_confirmar', 'confirmada'],
  marcar_no_asistio: ['por_confirmar', 'confirmada']
});

// Lanza un error conocido
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Convierte una fecha persistida
const toDate = (value) => {
  // Conserva fechas nativas
  const date = value instanceof Date
    ? value
    : typeof value?.toDate === 'function'
      ? value.toDate()
      : null;

  // Detiene horarios incompatibles
  if (!date || Number.isNaN(date.getTime())) {
    fail('failed-precondition', 'La cita no tiene un horario válido');
  }

  // Devuelve la fecha validada
  return date;
};

// Verifica al actor operativo
export const requireManagementActor = (snapshot) => {
  // Obtiene el perfil persistido
  const actor = snapshot.exists ? snapshot.data() : null;

  // Detiene identidades sin permisos
  if (
    actor?.activo !== true
    || !['admin', 'recepcion'].includes(actor?.rol)
  ) {
    fail('permission-denied', 'No tienes permisos para gestionar citas');
  }
};

// Verifica el contrato estructural de la cita
const requireAppointmentStructure = (appointment) => {
  // Detiene esquemas que no puede cobrar el POS
  if (appointment.schemaVersion !== 3) {
    fail('failed-precondition', 'La cita requiere actualizar su formato');
  }

  // Verifica la identidad del cliente
  if (
    typeof appointment.clienteId !== 'string'
    || !appointment.clienteId
    || appointment.clienteId.includes('/')
  ) {
    fail('failed-precondition', 'La cita no tiene un cliente válido');
  }

  // Verifica la identidad del cupo
  if (
    typeof appointment.cupoId !== 'string'
    || !appointment.cupoId
    || appointment.cupoId.includes('/')
  ) {
    fail('failed-precondition', 'La cita no tiene un cupo válido');
  }
};

// Verifica las ventanas temporales
const requireActionTime = ({ appointment, now, request }) => {
  // Obtiene el inicio canónico
  const startTime = toDate(appointment.inicio).getTime();
  const currentTime = now.getTime();

  // Evita entrar a cabina demasiado pronto
  if (
    request.action === 'enviar_cabina'
    && currentTime < startTime - CABIN_ADVANCE_MINUTES * 60_000
  ) {
    fail(
      'failed-precondition',
      'La cita podrá pasar a cabina treinta minutos antes'
    );
  }

  // Define el inicio de la inasistencia
  const noShowTime = startTime + NO_SHOW_TOLERANCE_MINUTES * 60_000;

  // Protege la tolerancia de inasistencia
  if (
    request.action === 'marcar_no_asistio'
    && currentTime < noShowTime
  ) {
    fail(
      'failed-precondition',
      'Espera quince minutos antes de registrar la inasistencia'
    );
  }

  // Evita reclasificar inasistencias como cancelaciones del cliente
  if (
    request.action === 'cancelar'
    && request.origin === 'cliente'
    && currentTime >= noShowTime
  ) {
    fail(
      'failed-precondition',
      'Registra una inasistencia después de la tolerancia'
    );
  }
};

// Verifica el estado y el tiempo de la cita
export const requireManagedAppointment = ({
  now,
  request,
  snapshot
}) => {
  // Detiene citas ausentes
  if (!snapshot.exists) {
    fail('not-found', 'La cita no existe');
  }

  // Obtiene la fotografia persistida
  const appointment = snapshot.data();

  requireAppointmentStructure(appointment);

  // Detecta un reintento del estado final
  if (appointment.estado === request.status) {
    return {
      appointment,
      isRetry: true
    };
  }

  // Verifica la transicion solicitada
  if (
    !allowedPreviousStatuses[request.action].includes(appointment.estado)
  ) {
    fail('failed-precondition', 'La cita ya no permite esta acción');
  }

  requireActionTime({ appointment, now, request });

  // Devuelve la cita validada
  return {
    appointment,
    isRetry: false
  };
};

// Verifica el cupo relacionado
export const requireManagedSlot = ({
  appointmentId,
  snapshot
}) => {
  // Detiene cupos ausentes o ajenos
  if (
    !snapshot.exists
    || snapshot.data().citaId !== appointmentId
  ) {
    fail('failed-precondition', 'El cupo de la cita no es válido');
  }
};

// Verifica el correo canónico del cliente
export const requireManagementClientEmail = (snapshot) => {
  // Obtiene el cliente vigente
  const client = snapshot?.exists ? snapshot.data() : null;
  const email = typeof client?.emailNormalizado === 'string'
    ? client.emailNormalizado.trim().toLowerCase()
    : '';

  // Detiene clientes ausentes fusionados o sin correo válido
  if (
    !client
    || client.fusionado === true
    || email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    fail(
      'failed-precondition',
      'El cliente no tiene un correo válido'
    );
  }
};
