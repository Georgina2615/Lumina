import { createHash } from 'node:crypto';

// Define el precio maximo permitido
export const maximumServicePriceCents = 100_000_000;

// Define la ultima posicion permitida
export const maximumServiceOrder = 999;

// Define los caracteres comerciales aceptados
const SERVICE_NAME_PATTERN = /^[\p{L}\p{M}\p{N} .,'’:/&+%°()#-]+$/u;

// Define las acciones permitidas para servicios
const SERVICE_ACTIONS = new Set([
  'create',
  'update',
  'set_active'
]);

// Define los campos aceptados por cada accion
const ACTION_FIELDS = Object.freeze({
  create: new Set([
    'action',
    'operationId',
    'serviceId',
    'name',
    'publicDescription',
    'priceCents'
  ]),
  update: new Set([
    'action',
    'operationId',
    'serviceId',
    'expectedRevision',
    'name',
    'publicDescription',
    'priceCents'
  ]),
  set_active: new Set([
    'action',
    'operationId',
    'serviceId',
    'expectedRevision',
    'active'
  ])
});

// Representa un incumplimiento esperado del catalogo
export class ServiceCatalogError extends Error {
  // Conserva el codigo compatible con funciones
  constructor(code, message) {
    super(message);
    this.name = 'ServiceCatalogError';
    this.code = code;
  }
}

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new ServiceCatalogError(code, message);
};

// Verifica un nombre comercial seguro
export const isValidServiceName = (value) => (
  typeof value === 'string'
  && value.length >= 2
  && value.length <= 120
  && /\p{L}/u.test(value)
  && SERVICE_NAME_PATTERN.test(value)
);

// Normaliza el nombre obligatorio
const requireServiceName = (value) => {
  const normalized = typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';

  if (!isValidServiceName(normalized)) {
    fail('invalid-argument', 'El nombre no es válido');
  }

  return normalized;
};

// Verifica una descripcion publica canonica
export const isValidPublicDescription = (value) => (
  typeof value === 'string'
  && value === value.trim()
  && value.length <= 500
);

// Normaliza la descripcion publica opcional
const requireDescription = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : null;

  if (!isValidPublicDescription(normalized)) {
    fail('invalid-argument', 'La descripción no es válida');
  }

  return normalized;
};

// Verifica identificadores documentales seguros
const requireIdentifier = (value, label) => {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) {
    fail('invalid-argument', `${label} no es válida`);
  }

  return normalized;
};

// Verifica una revision optimista
const requireRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail('invalid-argument', 'La revisión no es válida');
  }

  return value;
};

// Verifica un precio positivo en centavos
const requirePrice = (value) => {
  if (
    !Number.isSafeInteger(value)
    || value <= 0
    || value > maximumServicePriceCents
  ) {
    fail('invalid-argument', 'El precio no es válido');
  }

  return value;
};

// Verifica una posicion persistida segura
export const isValidServiceOrder = (value) => (
  Number.isSafeInteger(value)
  && value >= 1
  && value <= maximumServiceOrder
);

// Rechaza campos que el servidor no reconoce
const requireKnownFields = (source, action) => {
  const allowedFields = ACTION_FIELDS[action];
  const hasUnknownField = Object.keys(source).some(
    (field) => !allowedFields.has(field)
  );

  if (hasUnknownField || Object.keys(source).length !== allowedFields.size) {
    fail('invalid-argument', 'La solicitud contiene información no permitida');
  }
};

// Normaliza los campos editables del servicio
const normalizeServiceFields = (source) => ({
  name: requireServiceName(source.name),
  publicDescription: requireDescription(source.publicDescription),
  priceCents: requirePrice(source.priceCents)
});

// Valida una operacion de catalogo
export const validateManageServiceCatalogRequest = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data)
    ? data
    : {};

  if (!SERVICE_ACTIONS.has(source.action)) {
    fail('invalid-argument', 'La acción solicitada no es válida');
  }

  requireKnownFields(source, source.action);

  const base = {
    action: source.action,
    operationId: requireIdentifier(source.operationId, 'La operación'),
    serviceId: requireIdentifier(source.serviceId, 'El servicio')
  };

  if (source.action === 'create') {
    return { ...base, ...normalizeServiceFields(source) };
  }

  const expectedRevision = requireRevision(source.expectedRevision);

  if (source.action === 'update') {
    return {
      ...base,
      expectedRevision,
      ...normalizeServiceFields(source)
    };
  }

  if (typeof source.active !== 'boolean') {
    fail('invalid-argument', 'El estado solicitado no es válido');
  }

  return { ...base, active: source.active, expectedRevision };
};

// Resume el contenido normalizado de una operacion
export const buildServiceCatalogRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
