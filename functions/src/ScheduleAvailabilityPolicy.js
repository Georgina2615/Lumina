import { createHash } from 'node:crypto';
import { AppointmentError } from './AppointmentError.js';
import {
  APPOINTMENT_TIMES,
  buildAppointmentInterval,
  MINIMUM_NOTICE_MINUTES
} from './AppointmentSchedulePolicy.js';

// Define las acciones permitidas
const AVAILABILITY_ACTIONS = new Set([
  'block_slot',
  'block_day',
  'reopen_slot'
]);

// Define los campos permitidos por accion
const ACTION_FIELDS = Object.freeze({
  block_slot: new Set([
    'action',
    'dateKey',
    'time',
    'reason',
    'operationId'
  ]),
  block_day: new Set([
    'action',
    'dateKey',
    'reason',
    'operationId'
  ]),
  reopen_slot: new Set([
    'action',
    'dateKey',
    'time',
    'operationId'
  ])
});

// Define los campos obligatorios por accion
const REQUIRED_ACTION_FIELDS = Object.freeze({
  block_slot: new Set([
    'action',
    'dateKey',
    'time',
    'operationId'
  ]),
  block_day: new Set([
    'action',
    'dateKey',
    'operationId'
  ]),
  reopen_slot: ACTION_FIELDS.reopen_slot
});

// Define los caracteres permitidos en un motivo
const REASON_PATTERN = /^[\p{L}\p{M}\p{N} .,'’:/&+%°()#-]+$/u;

// Representa un incumplimiento esperado de disponibilidad
export class ScheduleAvailabilityError extends Error {
  // Conserva el codigo compatible con funciones
  constructor(code, message) {
    super(message);
    this.name = 'ScheduleAvailabilityError';
    this.code = code;
  }
}

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new ScheduleAvailabilityError(code, message);
};

// Reconoce objetos simples
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Normaliza un identificador documental
const requireOperationId = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) {
    fail('invalid-argument', 'La operación no es válida');
  }

  return normalized;
};

// Normaliza el motivo administrativo opcional
const normalizeReason = (value) => {
  const normalized = typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';

  if (!normalized && (value == null || typeof value === 'string')) {
    return null;
  }

  if (
    normalized.length < 3
    || normalized.length > 160
    || !/\p{L}/u.test(normalized)
    || !REASON_PATTERN.test(normalized)
  ) {
    fail('invalid-argument', 'Indica un motivo válido');
  }

  return normalized;
};

// Rechaza campos desconocidos
const requireKnownFields = (source, action) => {
  const allowedFields = ACTION_FIELDS[action];
  const requiredFields = REQUIRED_ACTION_FIELDS[action];
  const fields = Object.keys(source);

  if (
    fields.some((field) => !allowedFields.has(field))
    || [...requiredFields].some((field) => !fields.includes(field))
  ) {
    fail('invalid-argument', 'La solicitud contiene información no permitida');
  }
};

// Construye los intervalos futuros de un dia
const buildDayIntervals = ({ dateKey, now }) => {
  const intervals = APPOINTMENT_TIMES.map((time) => (
    buildInterval({
      dateKey,
      time,
      now,
      enforceMinimumNotice: false
    })
  ));
  const minimumStart = (
    now.getTime() + MINIMUM_NOTICE_MINUTES * 60 * 1000
  );
  const futureIntervals = intervals.filter(
    ({ start }) => start.getTime() >= minimumStart
  );

  if (!futureIntervals.length) {
    fail(
      'failed-precondition',
      'No quedan horarios futuros por bloquear en esa fecha'
    );
  }

  return futureIntervals;
};

// Convierte errores de horario al dominio de disponibilidad
const buildInterval = (options) => {
  try {
    return buildAppointmentInterval(options);
  } catch (error) {
    if (error instanceof AppointmentError) {
      fail(error.code, error.message);
    }

    throw error;
  }
};

// Valida una solicitud de disponibilidad
export const validateScheduleAvailabilityRequest = (
  data,
  now = new Date()
) => {
  const source = isRecord(data) ? data : {};

  if (!AVAILABILITY_ACTIONS.has(source.action)) {
    fail('invalid-argument', 'La acción solicitada no es válida');
  }

  requireKnownFields(source, source.action);

  const base = {
    action: source.action,
    operationId: requireOperationId(source.operationId)
  };

  if (source.action === 'block_day') {
    const intervals = buildDayIntervals({
      dateKey: source.dateKey,
      now
    });

    return {
      ...base,
      dateKey: intervals[0].dateKey,
      reason: normalizeReason(source.reason),
      intervals
    };
  }

  const interval = buildInterval({
    dateKey: source.dateKey,
    time: source.time,
    now,
    enforceMinimumNotice: source.action === 'block_slot'
  });

  return {
    ...base,
    dateKey: interval.dateKey,
    time: interval.time,
    reason: source.action === 'block_slot'
      ? normalizeReason(source.reason)
      : null,
    intervals: [interval]
  };
};

// Resume el contenido normalizado de una operacion
export const buildScheduleAvailabilityRequestHash = (request) => {
  const input = {
    action: request.action,
    dateKey: request.dateKey,
    time: request.time ?? null,
    reason: request.reason ?? null,
    operationId: request.operationId
  };

  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
};
