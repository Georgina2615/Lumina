import { createHash } from 'node:crypto';
import { CABIN_UNIT_SCALES } from './CabinInventoryCalculations.js';
import { CabinInventoryError } from './CabinInventoryError.js';

// Define acciones permitidas para insumos
const SUPPLY_ACTIONS = new Set([
  'create',
  'update',
  'set_active',
  'adjust_stock'
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
  throw new CabinInventoryError(code, message);
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

// Verifica una revisión optimista
const requireRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail('invalid-argument', 'La revisión no es válida');
  }
  return value;
};

// Verifica una cantidad escalada positiva
const requireQuantity = (value, label) => {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 999_999_999) {
    fail('invalid-argument', `${label} no es válida`);
  }
  return value;
};

// Verifica un mínimo escalado
const requireMinimumStock = (value) => {
  if (!Number.isSafeInteger(value) || value < 0 || value > 999_999_999) {
    fail('invalid-argument', 'El stock mínimo no es válido');
  }
  return value;
};

// Verifica un importe monetario positivo
const requireMoney = (value, label) => {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000) {
    fail('invalid-argument', `${label} no es válido`);
  }
  return value;
};

// Normaliza los campos editables
const normalizeSupplyFields = (source) => ({
  name: requireText(source.name, 'El nombre', 2, 120),
  brand: optionalText(source.brand, 'La marca', 80),
  category: requireText(source.category, 'La categoría', 2, 80),
  description: optionalText(source.description, 'La descripción', 500),
  minimumStockScaled: requireMinimumStock(source.minimumStockScaled)
});

// Normaliza un alta de insumo
const normalizeCreateRequest = (source, base) => {
  if (!Object.hasOwn(CABIN_UNIT_SCALES, source.unit)) {
    fail('invalid-argument', 'La unidad no es válida');
  }
  return {
    ...base,
    ...normalizeSupplyFields(source),
    unit: source.unit,
    initialQuantityScaled: requireQuantity(
      source.initialQuantityScaled,
      'La cantidad inicial'
    ),
    inventoryValueCents: requireMoney(
      source.inventoryValueCents,
      'El costo total inicial'
    )
  };
};

// Normaliza un movimiento de existencias
const normalizeStockRequest = (source, base, expectedRevision) => {
  if (!STOCK_TYPES.has(source.type)) {
    fail('invalid-argument', 'El movimiento solicitado no es válido');
  }
  const request = {
    ...base,
    expectedRevision,
    type: source.type,
    quantityScaled: requireQuantity(source.quantityScaled, 'La cantidad'),
    reason: requireText(source.reason, 'El motivo', 3, 240),
    reference: optionalText(source.reference, 'La referencia', 120),
    totalCostCents: source.totalCostCents ?? null
  };
  if (request.type === 'entrada_reabastecimiento') {
    request.totalCostCents = requireMoney(
      request.totalCostCents,
      'El costo total'
    );
  } else if (request.type === 'ajuste_positivo') {
    request.totalCostCents = request.totalCostCents === null
      ? null
      : requireMoney(request.totalCostCents, 'El costo total');
  } else if (request.totalCostCents !== null) {
    fail('invalid-argument', 'Este movimiento no admite costo');
  }
  return request;
};

// Valida una operación de inventario de cabina
export const validateManageCabinSupplyRequest = (data) => {
  const source = data && typeof data === 'object' ? data : {};
  if (!SUPPLY_ACTIONS.has(source.action)) {
    fail('invalid-argument', 'La acción solicitada no es válida');
  }
  const base = {
    action: source.action,
    operationId: requireIdentifier(source.operationId, 'La operación'),
    supplyId: requireIdentifier(source.supplyId, 'El insumo')
  };
  if (source.action === 'create') {
    return normalizeCreateRequest(source, base);
  }
  const expectedRevision = requireRevision(source.expectedRevision);
  if (source.action === 'update') {
    if (source.unit !== undefined) {
      fail('invalid-argument', 'La unidad no puede modificarse');
    }
    return {
      ...base,
      expectedRevision,
      ...normalizeSupplyFields(source)
    };
  }
  if (source.action === 'set_active') {
    if (typeof source.active !== 'boolean') {
      fail('invalid-argument', 'El estado solicitado no es válido');
    }
    return { ...base, active: source.active, expectedRevision };
  }
  return normalizeStockRequest(source, base, expectedRevision);
};

// Resume el contenido normalizado de una operación
export const buildCabinInventoryRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
