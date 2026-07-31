import { createHash } from 'node:crypto';
import { RetailInventoryError } from './RetailInventoryError.js';

// Define acciones permitidas para productos
const PRODUCT_ACTIONS = new Set([
  'create',
  'update',
  'set_active',
  'attach_image'
]);

// Define movimientos manuales permitidos
const STOCK_TYPES = new Set([
  'entrada_reabastecimiento',
  'ajuste_positivo',
  'ajuste_negativo',
  'salida_merma',
  'salida_caducidad'
]);

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new RetailInventoryError(code, message);
};

// Normaliza texto obligatorio
const requireText = (value, label, minimum, maximum) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length < minimum || normalized.length > maximum) {
    fail('invalid-argument', `${label} no es válido`);
  }
  return normalized;
};

// Normaliza texto opcional
const optionalText = (value, label, maximum) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (normalized.length > maximum) {
    fail('invalid-argument', `${label} no es válido`);
  }
  return normalized;
};

// Verifica identificadores documentales seguros
const requireIdentifier = (value, label) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) {
    fail('invalid-argument', `${label} no es válido`);
  }
  return normalized;
};

// Verifica importes monetarios positivos
const requireMoney = (value, label) => {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 100_000_000) {
    fail('invalid-argument', `${label} no es válido`);
  }
  return value;
};

// Verifica una revisión optimista
const requireRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail('invalid-argument', 'La revisión no es válida');
  }
  return value;
};

// Normaliza los campos editables
const normalizeProductFields = (data, includeCost) => {
  const fields = {
    name: requireText(data.name, 'El nombre', 2, 120),
    brand: requireText(data.brand, 'La marca', 2, 80),
    category: requireText(data.category, 'La categoría', 2, 80),
    description: optionalText(data.description, 'La descripción', 500),
    priceCents: requireMoney(data.priceCents, 'El precio'),
    minimumStock: data.minimumStock
  };
  if (
    !Number.isSafeInteger(fields.minimumStock)
    || fields.minimumStock < 0
    || fields.minimumStock > 99_999
  ) {
    fail('invalid-argument', 'El stock mínimo no es válido');
  }
  return includeCost
    ? { ...fields, unitCostCents: requireMoney(data.unitCostCents, 'El costo') }
    : fields;
};

// Valida una operación de administración
export const validateManageRetailProductRequest = (data) => {
  const source = data && typeof data === 'object' ? data : {};
  if (!PRODUCT_ACTIONS.has(source.action)) {
    fail('invalid-argument', 'La acción solicitada no es válida');
  }
  const base = {
    action: source.action,
    operationId: requireIdentifier(source.operationId, 'La operación'),
    productId: requireIdentifier(source.productId, 'El producto')
  };
  if (source.action === 'create') {
    return { ...base, ...normalizeProductFields(source, true) };
  }
  const expectedRevision = requireRevision(source.expectedRevision);
  if (source.action === 'update') {
    return {
      ...base,
      expectedRevision,
      ...normalizeProductFields(source, false)
    };
  }
  if (source.action === 'set_active') {
    if (typeof source.active !== 'boolean') {
      fail('invalid-argument', 'El estado solicitado no es válido');
    }
    return { ...base, active: source.active, expectedRevision };
  }
  const expectedPath = `productos/${base.productId}/catalogo.webp`;
  if (source.imagePath !== expectedPath) {
    fail('invalid-argument', 'La ruta de imagen no es válida');
  }
  return { ...base, expectedRevision, imagePath: expectedPath };
};

// Valida un ajuste manual de existencias
export const validateAdjustRetailStockRequest = (data) => {
  const source = data && typeof data === 'object' ? data : {};
  if (!STOCK_TYPES.has(source.type)) {
    fail('invalid-argument', 'El movimiento solicitado no es válido');
  }
  if (
    !Number.isSafeInteger(source.quantity)
    || source.quantity <= 0
    || source.quantity > 99_999
  ) {
    fail('invalid-argument', 'La cantidad no es válida');
  }
  const request = {
    operationId: requireIdentifier(source.operationId, 'La operación'),
    productId: requireIdentifier(source.productId, 'El producto'),
    expectedRevision: requireRevision(source.expectedRevision),
    type: source.type,
    quantity: source.quantity,
    reason: requireText(source.reason, 'El motivo', 3, 240),
    reference: optionalText(source.reference, 'La referencia', 120),
    unitCostCents: source.unitCostCents ?? null
  };
  if (request.type === 'entrada_reabastecimiento') {
    request.unitCostCents = requireMoney(request.unitCostCents, 'El costo');
  } else if (request.type === 'ajuste_positivo' && request.unitCostCents !== null) {
    request.unitCostCents = requireMoney(request.unitCostCents, 'El costo');
  } else if (request.unitCostCents !== null) {
    fail('invalid-argument', 'Este movimiento no admite costo unitario');
  }
  return request;
};

// Resume el contenido normalizado de una operación
export const buildRetailInventoryRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
