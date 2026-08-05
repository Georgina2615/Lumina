import { ClinicalCompletionError } from './ClinicalCompletionError.js';

// Detiene una solicitud inválida
const fail = (message) => {
  throw new ClinicalCompletionError('invalid-argument', message);
};

// Normaliza un identificador seguro
const requireIdentifier = (value, label) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(value)) {
    fail(`${label} no es válido`);
  }
  return value;
};

// Valida la solicitud mínima de cierre
export const validateClinicalCompletionRequest = (data) => {
  const fields = ['appointmentId', 'operationId'];
  if (
    !data
    || typeof data !== 'object'
    || Array.isArray(data)
    || Object.keys(data).length !== fields.length
    || fields.some((field) => !Object.hasOwn(data, field))
  ) fail('La solicitud de cierre está incompleta');
  return {
    appointmentId: requireIdentifier(data.appointmentId, 'La cita'),
    operationId: requireIdentifier(data.operationId, 'La operación')
  };
};
