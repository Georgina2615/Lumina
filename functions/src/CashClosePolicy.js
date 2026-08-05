import { createHash } from 'node:crypto';

const CASH_CLOSE_ACTIONS = new Set(['close', 'correct']);
const MAX_CENTS = 100_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const OPERATION_PATTERN = /^[A-Za-z0-9_-]{3,128}$/;
const REASON_PATTERN = /^[\p{L}\p{M}\p{N} .,'’:/&+%°()#-]+$/u;

const actionFields = Object.freeze({
  close: new Set([
    'action', 'dateKey', 'openingCashCents', 'withdrawalsCents',
    'countedCashCents', 'operationId'
  ]),
  correct: new Set([
    'action', 'dateKey', 'openingCashCents', 'withdrawalsCents',
    'countedCashCents', 'reason', 'expectedRevision', 'operationId'
  ])
});

// Representa un error conocido del corte
export class CashCloseError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'CashCloseError';
    this.code = code;
  }
}

// Detiene una solicitud invalida
export const failCashClose = (code, message) => {
  throw new CashCloseError(code, message);
};

// Reconoce objetos simples
const isRecord = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

// Obtiene la fecha civil del negocio
export const getBusinessDateKey = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Mexico_City',
      year: 'numeric'
    }).formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
};

// Construye el inicio y final de un dia terminado
export const buildCashCloseDayRange = (dateKey) => {
  if (!DATE_PATTERN.test(dateKey)) {
    failCashClose('invalid-argument', 'Selecciona una fecha válida');
  }

  const start = new Date(`${dateKey}T00:00:00-06:00`);
  const [year, month, day] = dateKey.split('-').map(Number);
  const canonicalKey = [
    start.getUTCFullYear(),
    String(start.getUTCMonth() + 1).padStart(2, '0'),
    String(start.getUTCDate()).padStart(2, '0')
  ].join('-');

  if (
    canonicalKey !== dateKey
    || start.getUTCFullYear() !== year
    || start.getUTCMonth() + 1 !== month
    || start.getUTCDate() !== day
  ) {
    failCashClose('invalid-argument', 'Selecciona una fecha válida');
  }

  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

// Exige centavos enteros dentro del rango permitido
const requireCents = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_CENTS) {
    failCashClose('invalid-argument', `${label} no es válido`);
  }

  return value;
};

// Normaliza el motivo de una correccion
const requireCorrectionReason = (value) => {
  const reason = typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';

  if (
    reason.length < 5
    || reason.length > 200
    || !/\p{L}/u.test(reason)
    || !REASON_PATTERN.test(reason)
  ) {
    failCashClose('invalid-argument', 'Explica el motivo de la corrección');
  }

  return reason;
};

// Valida una solicitud de corte
export const validateCashCloseRequest = (data, now = new Date()) => {
  const source = isRecord(data) ? data : {};

  if (!CASH_CLOSE_ACTIONS.has(source.action)) {
    failCashClose('invalid-argument', 'La acción solicitada no es válida');
  }

  const fields = Object.keys(source);
  const allowedFields = actionFields[source.action];
  if (
    fields.some((field) => !allowedFields.has(field))
    || [...allowedFields].some((field) => !fields.includes(field))
  ) {
    failCashClose('invalid-argument', 'La solicitud contiene información no permitida');
  }

  buildCashCloseDayRange(source.dateKey);
  if (source.dateKey >= getBusinessDateKey(now)) {
    failCashClose('failed-precondition', 'Solo puedes cerrar días que ya terminaron');
  }

  const request = {
    action: source.action,
    dateKey: source.dateKey,
    openingCashCents: requireCents(source.openingCashCents, 'El dinero inicial'),
    withdrawalsCents: requireCents(source.withdrawalsCents, 'Los retiros'),
    countedCashCents: requireCents(source.countedCashCents, 'El efectivo contado'),
    operationId: typeof source.operationId === 'string'
      ? source.operationId.trim()
      : ''
  };

  if (!OPERATION_PATTERN.test(request.operationId)) {
    failCashClose('invalid-argument', 'La operación no es válida');
  }

  if (source.action === 'correct') {
    if (!Number.isSafeInteger(source.expectedRevision) || source.expectedRevision < 1) {
      failCashClose('invalid-argument', 'Actualiza el corte antes de corregirlo');
    }
    request.expectedRevision = source.expectedRevision;
    request.reason = requireCorrectionReason(source.reason);
  }

  return request;
};

// Resume una solicitud para reconocer reintentos
export const buildCashCloseRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
