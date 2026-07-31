import { AppointmentError } from './AppointmentError.js';

// Relaciona cada accion con su estado final
const actionStatuses = Object.freeze({
  confirmar: 'confirmada',
  enviar_cabina: 'en_cabina',
  enviar_cobro: 'por_cobrar',
  cancelar: 'cancelada',
  marcar_no_asistio: 'no_asistio'
});

// Reconoce objetos simples
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Lanza un error conocido
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Normaliza texto limitado
const normalizeText = (value, label, minimum, maximum) => {
  // Detiene valores que no son texto
  if (typeof value !== 'string') {
    fail('invalid-argument', `${label} no es válido`);
  }

  // Elimina espacios accidentales
  const normalized = value.trim();

  // Detiene longitudes desconocidas
  if (normalized.length < minimum || normalized.length > maximum) {
    fail('invalid-argument', `${label} no es válido`);
  }

  // Devuelve el texto validado
  return normalized;
};

// Valida la solicitud publica
export const validateManagementRequest = (data) => {
  // Detiene solicitudes desconocidas
  if (!isRecord(data)) {
    fail('invalid-argument', 'La solicitud no es válida');
  }

  // Limita el contrato de entrada
  const allowedKeys = [
    'appointmentId',
    'action',
    'channel',
    'origin',
    'reason'
  ];

  // Detiene propiedades adicionales
  if (Object.keys(data).some((key) => !allowedKeys.includes(key))) {
    fail('invalid-argument', 'La solicitud contiene campos no permitidos');
  }

  // Normaliza la identidad documental
  const appointmentId = normalizeText(
    data.appointmentId,
    'La cita',
    1,
    500
  );

  // Evita rutas documentales
  if (appointmentId.includes('/')) {
    fail('invalid-argument', 'La cita no es válida');
  }

  // Obtiene el estado final conocido
  const status = actionStatuses[data.action];

  // Detiene acciones desconocidas
  if (!status) {
    fail('invalid-argument', 'La acción no es válida');
  }

  // Valida el canal usado al confirmar
  const channel = data.action === 'confirmar'
    ? normalizeText(data.channel, 'El canal', 1, 20)
    : null;

  if (
    channel
    && !['correo', 'llamada', 'whatsapp', 'presencial'].includes(channel)
  ) {
    fail('invalid-argument', 'El canal no es válido');
  }

  // Valida el origen usado al cancelar
  const origin = data.action === 'cancelar'
    ? normalizeText(data.origin, 'El origen', 1, 20)
    : null;

  if (origin && !['cliente', 'clinica'].includes(origin)) {
    fail('invalid-argument', 'El origen no es válido');
  }

  // Valida el motivo para estados terminales
  const needsReason = [
    'cancelar',
    'marcar_no_asistio'
  ].includes(data.action);
  const reason = needsReason
    ? normalizeText(data.reason, 'El motivo', 5, 500)
    : null;

  // Detiene datos que no pertenecen a la accion
  if (
    (data.action !== 'confirmar' && data.channel !== undefined)
    || (data.action !== 'cancelar' && data.origin !== undefined)
    || (!needsReason && data.reason !== undefined)
  ) {
    fail('invalid-argument', 'La solicitud contiene campos no permitidos');
  }

  // Devuelve el contrato validado
  return {
    action: data.action,
    appointmentId,
    channel,
    origin,
    reason,
    status
  };
};
