import {
  normalizeAppointmentDeposit
} from './AppointmentDepositPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import {
  buildAppointmentInterval
} from './AppointmentSchedulePolicy.js';

// Reconoce objetos simples
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Lanza un error conocido
const fail = (message) => {
  throw new AppointmentError('invalid-argument', message);
};

// Normaliza una identidad documental
const normalizeDocumentId = (value, label) => {
  // Limpia el identificador recibido
  const normalized = typeof value === 'string' ? value.trim() : '';

  // Detiene rutas y valores vacíos
  if (
    !normalized
    || normalized.length > 500
    || normalized.includes('/')
  ) {
    fail(`${label} no es válido`);
  }

  // Devuelve el identificador validado
  return normalized;
};

// Valida la solicitud de reprogramacion
export const validateReprogramRequest = (
  data,
  now = new Date()
) => {
  // Detiene solicitudes desconocidas
  if (!isRecord(data)) {
    fail('La solicitud de reprogramación no es válida');
  }

  // Define las propiedades permitidas
  const allowedKeys = [
    'sourceAppointmentId',
    'serviceId',
    'dateKey',
    'time',
    'additionalDeposit'
  ];

  // Detiene propiedades adicionales
  if (Object.keys(data).some((key) => !allowedKeys.includes(key))) {
    fail('La solicitud contiene campos no permitidos');
  }

  // Construye el intervalo autorizado
  const interval = buildAppointmentInterval({
    dateKey: data.dateKey,
    time: data.time,
    now,
    enforceMinimumNotice: false
  });

  // Normaliza el posible anticipo adicional
  const additionalDeposit = Object.hasOwn(data, 'additionalDeposit')
    ? normalizeAppointmentDeposit(data.additionalDeposit)
    : null;

  // Devuelve el contrato canónico
  return {
    sourceAppointmentId: normalizeDocumentId(
      data.sourceAppointmentId,
      'La cita de origen'
    ),
    serviceId: normalizeDocumentId(
      data.serviceId,
      'El servicio'
    ),
    dateKey: interval.dateKey,
    time: interval.time,
    interval,
    additionalDeposit
  };
};
