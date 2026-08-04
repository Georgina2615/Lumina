import {
  BOOKING_BLOCK_MINUTES
} from './AppointmentSchedulePolicy.js';

// Construye un bloqueo administrativo
export const buildScheduleBlockDocument = ({
  actorUid,
  interval,
  reason,
  timestamp,
  toTimestamp
}) => ({
  tipo: 'bloqueo_admin',
  fecha: interval.dateKey,
  hora: interval.time,
  inicio: toTimestamp(interval.start),
  finBloque: toTimestamp(interval.blockEnd),
  duracionBloqueMinutos: BOOKING_BLOCK_MINUTES,
  motivo: reason,
  creadoEn: timestamp,
  creadoPor: actorUid,
  schemaVersion: 1
});

// Construye una respuesta estable
export const buildScheduleAvailabilityResponse = ({
  affectedSlotIds,
  operationId
}) => ({
  operationId,
  affectedSlotIds
});

// Construye el historial privado del cambio
export const buildScheduleAvailabilityChangeDocument = ({
  actorUid,
  affectedSlotIds,
  previousBlock,
  request,
  requestHash,
  response,
  timestamp
}) => ({
  accion: request.action,
  actorUid,
  fechaAgenda: request.dateKey,
  hora: request.time ?? null,
  motivo: request.reason ?? previousBlock?.motivo ?? null,
  cuposAfectados: affectedSlotIds,
  registradaEn: timestamp,
  idempotencia: {
    hashSolicitud: requestHash
  },
  resultado: response,
  schemaVersion: 1
});
