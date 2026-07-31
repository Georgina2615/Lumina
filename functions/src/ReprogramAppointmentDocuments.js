import {
  buildStoredDepositPart
} from './AppointmentDepositPolicy.js';

// Resume los métodos reales del anticipo
const resolveDepositMethod = (parts) => {
  // Reúne métodos sin repetirlos
  const methods = [...new Set(parts.map(({ metodo }) => metodo))];

  // Devuelve el método individual o mixto
  return methods.length === 1 ? methods[0] : 'mixto';
};

// Construye la nueva cita reprogramada
export const buildReprogrammedAppointment = ({
  actorUid,
  additionalCents,
  client,
  creditCents,
  interval,
  parts,
  paymentIds,
  requiredCents,
  service,
  slotId,
  sourceAppointmentId,
  timestamp,
  toTimestamp
}) => ({
  clienteId: client.id,
  nombreCompleto: client.name,
  servicioId: service.id,
  servicio: service.name,
  precioServicioCentavos: service.priceCents,
  precioServicio: service.priceCents / 100,
  duracionServicioMinutos: service.serviceDurationMinutes,
  tiempoPreparacionMinutos: service.preparationMinutes,
  duracionBloqueMinutos: service.blockDurationMinutes,
  duracionMinutos: service.blockDurationMinutes,
  fecha: interval.dateKey,
  hora: interval.time,
  inicio: toTimestamp(interval.start),
  finTratamiento: toTimestamp(interval.treatmentEnd),
  finBloque: toTimestamp(interval.blockEnd),
  cupoId: slotId,
  estado: 'por_confirmar',
  contactoConfirmacion: {
    canal: client.contactChannel,
    estado: 'pendiente',
    requiereLlamada: client.contactChannel === 'llamada',
    solicitudEnviada: false
  },
  anticipoPagado: true,
  anticipoPorcentaje: service.depositPercentage,
  anticipoRequeridoCentavos: requiredCents,
  anticipoMontoCentavos: creditCents + additionalCents,
  anticipoMetodo: resolveDepositMethod(parts),
  anticipoPagos: parts,
  pagosAnticipoIds: paymentIds,
  creditoReprogramacionCentavos: creditCents,
  anticipoAdicionalCentavos: additionalCents,
  reprogramacionOrigen: sourceAppointmentId,
  recordatorioEnviado: false,
  creadaEn: timestamp,
  creadaPor: actorUid,
  schemaVersion: 3
});

// Construye el pago real de la diferencia
export const buildAdditionalDepositDocument = ({
  actorUid,
  additionalDeposit,
  amountCents,
  appointmentId,
  clientId,
  timestamp
}) => ({
  citaId: appointmentId,
  ventaId: null,
  clienteId: clientId,
  tipo: 'anticipo',
  metodo: additionalDeposit.method,
  montoCentavos: amountCents,
  partes: additionalDeposit.payments.map(buildStoredDepositPart),
  estado: 'confirmado',
  fecha: timestamp,
  actorUid,
  sucursalId: 'principal',
  schemaVersion: 1
});

// Construye la marca consumida de la fuente
export const buildSourceReprogramUpdate = ({
  actorUid,
  additionalCents,
  creditCents,
  destinationId,
  request,
  slotId,
  source,
  timestamp
}) => ({
  cancelacion: {
    ...source.cancelacion,
    reprogramacionDisponible: false
  },
  reprogramacion: {
    ...source.reprogramacion,
    estado: 'utilizada',
    aplicadaACitaId: destinationId,
    utilizadaEn: timestamp,
    utilizadaPor: actorUid,
    creditoAplicadoCentavos: creditCents,
    anticipoAdicionalCentavos: additionalCents,
    cupoId: slotId,
    destino: {
      citaId: destinationId,
      servicioId: request.serviceId,
      fecha: request.dateKey,
      hora: request.time
    }
  },
  actualizadaEn: timestamp,
  actualizadaPor: actorUid
});

// Construye el evento inmutable de la fuente
export const buildSourceReprogramEvent = ({
  actorUid,
  additionalCents,
  creditCents,
  destinationId,
  request,
  timestamp
}) => ({
  tipo: 'reprogramacion',
  citaDestinoId: destinationId,
  servicioId: request.serviceId,
  fechaDestino: request.dateKey,
  horaDestino: request.time,
  creditoAplicadoCentavos: creditCents,
  anticipoAdicionalCentavos: additionalCents,
  actorUid,
  fecha: timestamp
});

// Construye la respuesta estable
export const buildReprogramResponse = ({
  additionalCents,
  alreadyProcessed,
  clientId,
  creditCents,
  destinationId,
  paymentIds,
  slotId
}) => ({
  appointmentId: destinationId,
  clientId,
  slotId,
  depositAmountCents: creditCents + additionalCents,
  creditAppliedCents: creditCents,
  additionalDepositCents: additionalCents,
  depositPaymentIds: paymentIds,
  alreadyProcessed
});
