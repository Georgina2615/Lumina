import { normalizeAppointmentClient } from './AppointmentClientPolicy.js';
import {
  normalizeAppointmentDeposit
} from './AppointmentDepositPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import {
  buildAppointmentInterval
} from './AppointmentSchedulePolicy.js';

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Lanza un error conocido del dominio
const fail = (message) => {
  throw new AppointmentError('invalid-argument', message);
};

// Normaliza un identificador documental
const normalizeServiceId = (value) => {
  // Detiene rutas y valores vacíos
  if (
    typeof value !== 'string'
    || !value
    || value.length > 500
    || value.includes('/')
  ) {
    fail('Selecciona un servicio válido');
  }

  // Devuelve el identificador validado
  return value;
};

// Normaliza una solicitud completa
export const validateAppointmentRequest = (
  data,
  now = new Date()
) => {
  // Detiene solicitudes desconocidas
  if (!isRecord(data)) {
    fail('La solicitud de la cita no es válida');
  }

  // Define las propiedades públicas permitidas
  const allowedKeys = [
    'client',
    'serviceId',
    'dateKey',
    'time',
    'deposit'
  ];

  // Busca una propiedad desconocida
  const invalidKey = Object.keys(data).find(
    (key) => !allowedKeys.includes(key)
  );

  // Detiene contratos con información adicional
  if (invalidKey) {
    fail('La solicitud contiene campos no permitidos');
  }

  // Construye el intervalo autorizado
  const interval = buildAppointmentInterval({
    dateKey: data.dateKey,
    time: data.time,
    now
  });

  // Devuelve el contrato canónico
  return {
    client: normalizeAppointmentClient(data.client),
    serviceId: normalizeServiceId(data.serviceId),
    dateKey: interval.dateKey,
    time: interval.time,
    interval,
    deposit: normalizeAppointmentDeposit(data.deposit)
  };
};
