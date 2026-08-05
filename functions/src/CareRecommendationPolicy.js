import { createHash } from 'node:crypto';
import { CareRecommendationError } from './CareRecommendationError.js';

const MAXIMUM_PRODUCTS = 8;

// Detiene una solicitud inválida
const fail = (message) => {
  throw new CareRecommendationError('invalid-argument', message);
};

// Normaliza un identificador seguro
const requireIdentifier = (value, label, optional = false) => {
  if (optional && value === '') return '';
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(value)) {
    fail(`${label} no es válido`);
  }
  return value;
};

// Normaliza texto visible para la clienta
const normalizeText = (value) => {
  if (typeof value !== 'string') fail('Los cuidados en casa no son válidos');
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length > 2000) fail('Los cuidados en casa son demasiado largos');
  return normalized;
};

// Valida una fecha opcional real
const normalizeDate = (value) => {
  if (value === '') return '';
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail('La fecha sugerida no es válida');
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) fail('La fecha sugerida no es válida');
  return value;
};

// Valida una revisión optimista
const requireRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail('La versión de la recomendación no es válida');
  }
  return value;
};

// Valida y normaliza una recomendación completa
export const validateCareRecommendationRequest = (data) => {
  const fields = ['appointmentId', 'clientId', 'expectedRevision', 'operationId', 'recommendation'];
  if (
    !data
    || typeof data !== 'object'
    || Array.isArray(data)
    || Object.keys(data).length !== fields.length
    || fields.some((field) => !Object.hasOwn(data, field))
  ) fail('La recomendación está incompleta');

  const source = data.recommendation;
  const recommendationFields = ['careInstructions', 'nextVisitDate', 'productIds', 'serviceId'];
  if (
    !source
    || typeof source !== 'object'
    || Array.isArray(source)
    || Object.keys(source).length !== recommendationFields.length
    || recommendationFields.some((field) => !Object.hasOwn(source, field))
    || !Array.isArray(source.productIds)
    || source.productIds.length > MAXIMUM_PRODUCTS
  ) fail('El contenido de la recomendación está incompleto');

  const productIds = source.productIds.map((id) => requireIdentifier(id, 'Un producto'));
  if (new Set(productIds).size !== productIds.length) {
    fail('Cada producto debe aparecer una sola vez');
  }
  const recommendation = {
    careInstructions: normalizeText(source.careInstructions),
    nextVisitDate: normalizeDate(source.nextVisitDate),
    productIds: [...productIds].sort(),
    serviceId: requireIdentifier(source.serviceId, 'El servicio', true)
  };
  if (
    !recommendation.careInstructions
    && !recommendation.nextVisitDate
    && recommendation.productIds.length === 0
    && !recommendation.serviceId
  ) fail('Agrega al menos una recomendación de cuidado');

  return {
    appointmentId: requireIdentifier(data.appointmentId, 'La cita'),
    clientId: requireIdentifier(data.clientId, 'La clienta'),
    expectedRevision: requireRevision(data.expectedRevision),
    operationId: requireIdentifier(data.operationId, 'La operación'),
    recommendation
  };
};

// Construye una huella estable de la solicitud
export const buildCareRecommendationRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
