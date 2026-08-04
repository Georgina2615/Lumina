import {
  BOOKING_BLOCK_MINUTES,
  DEPOSIT_PERCENTAGE,
  PREPARATION_MINUTES,
  SERVICE_DURATION_MINUTES
} from './AppointmentSchedulePolicy.js';

// Construye la respuesta estable de una operacion
export const buildServiceCatalogResponse = ({
  active,
  operationId,
  revision,
  serviceId
}) => ({
  active,
  operationId,
  revision,
  serviceId
});

// Construye el contrato completo de un servicio nuevo
export const buildServiceDocument = ({ order, request }) => ({
  nombre: request.name,
  descripcionPublica: request.publicDescription,
  precioCentavos: request.priceCents,
  duracionServicioMinutos: SERVICE_DURATION_MINUTES,
  tiempoPreparacionMinutos: PREPARATION_MINUTES,
  duracionBloqueMinutos: BOOKING_BLOCK_MINUTES,
  porcentajeAnticipo: DEPOSIT_PERCENTAGE,
  activo: false,
  orden: order,
  revision: 1,
  schemaVersion: 1
});

// Construye los campos editables y canonicos
export const buildServiceUpdate = ({ order, request, revision }) => ({
  nombre: request.name,
  descripcionPublica: request.publicDescription,
  precioCentavos: request.priceCents,
  duracionServicioMinutos: SERVICE_DURATION_MINUTES,
  tiempoPreparacionMinutos: PREPARATION_MINUTES,
  duracionBloqueMinutos: BOOKING_BLOCK_MINUTES,
  porcentajeAnticipo: DEPOSIT_PERCENTAGE,
  orden: order,
  revision,
  schemaVersion: 1
});

// Construye el cambio de disponibilidad
export const buildServiceStatePatch = ({ active, revision }) => ({
  activo: active,
  revision,
  schemaVersion: 1
});

// Resume los valores relevantes para el historial
const buildServiceHistoryState = (service) => (
  service
    ? {
      nombre: String(service.nombre ?? ''),
      descripcionPublica: String(service.descripcionPublica ?? ''),
      precioCentavos: service.precioCentavos ?? null,
      duracionServicioMinutos: service.duracionServicioMinutos ?? null,
      tiempoPreparacionMinutos: service.tiempoPreparacionMinutos ?? null,
      duracionBloqueMinutos: service.duracionBloqueMinutos ?? null,
      porcentajeAnticipo: service.porcentajeAnticipo ?? null,
      activo: service.activo === true,
      orden: service.orden ?? null
    }
    : null
);

// Construye el historial privado del cambio
export const buildServiceChangeDocument = ({
  actorUid,
  nextService,
  previousRevision,
  previousService,
  request,
  requestHash,
  response,
  timestamp
}) => ({
  servicioId: request.serviceId,
  accion: request.action,
  actorUid,
  fecha: timestamp,
  revisionAnterior: previousRevision,
  revisionNueva: response.revision,
  antes: buildServiceHistoryState(previousService),
  despues: buildServiceHistoryState(nextService),
  idempotencia: {
    hashSolicitud: requestHash
  },
  resultado: response,
  schemaVersion: 1
});
