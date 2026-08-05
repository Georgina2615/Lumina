import { createHash } from 'node:crypto';
import { CabinInventoryError } from './CabinInventoryError.js';

const MAXIMUM_ITEMS = 12;

// Detiene una solicitud inválida
const fail = (code, message) => {
  throw new CabinInventoryError(code, message);
};

// Normaliza un identificador seguro
const requireIdentifier = (value, label) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,128}$/.test(value)) {
    fail('invalid-argument', `${label} no es válido`);
  }
  return value;
};

// Valida una cantidad de consumo
const requireQuantity = (value) => {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 999_999_999) {
    fail('invalid-argument', 'Una cantidad utilizada no es válida');
  }
  return value;
};

// Valida una revisión de inventario
const requireRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 1) {
    fail('invalid-argument', 'La revisión de un insumo no es válida');
  }
  return value;
};

// Valida el consumo completo de una cita
export const validateCabinConsumptionRequest = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data)
    ? data
    : {};
  const fields = ['appointmentId', 'clientId', 'items', 'operationId'];
  if (
    Object.keys(source).length !== fields.length
    || fields.some((field) => !Object.hasOwn(source, field))
    || !Array.isArray(source.items)
    || source.items.length < 1
    || source.items.length > MAXIMUM_ITEMS
  ) {
    fail('invalid-argument', 'El consumo de insumos está incompleto');
  }

  const items = source.items.map((item) => {
    const itemFields = ['expectedRevision', 'quantityScaled', 'supplyId'];
    if (
      !item
      || typeof item !== 'object'
      || Array.isArray(item)
      || Object.keys(item).length !== itemFields.length
      || itemFields.some((field) => !Object.hasOwn(item, field))
    ) fail('invalid-argument', 'Un insumo utilizado está incompleto');

    return {
      expectedRevision: requireRevision(item.expectedRevision),
      quantityScaled: requireQuantity(item.quantityScaled),
      supplyId: requireIdentifier(item.supplyId, 'El insumo')
    };
  });

  if (new Set(items.map(({ supplyId }) => supplyId)).size !== items.length) {
    fail('invalid-argument', 'Cada insumo debe aparecer una sola vez');
  }

  return {
    appointmentId: requireIdentifier(source.appointmentId, 'La cita'),
    clientId: requireIdentifier(source.clientId, 'La clienta'),
    items: [...items].sort((first, second) => first.supplyId.localeCompare(second.supplyId)),
    operationId: requireIdentifier(source.operationId, 'La operación')
  };
};

// Construye una huella estable del consumo
export const buildCabinConsumptionRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
