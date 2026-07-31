import {
  buildStoredDepositPart
} from './AppointmentDepositPolicy.js';

// Construye un cliente nuevo
export const buildAppointmentClientDocument = ({
  actorUid,
  client,
  timestamp
}) => ({
  nombreCompleto: client.fullName,
  telefono: client.phone,
  telefonoNormalizado: client.phone,
  email: client.email,
  emailNormalizado: client.email,
  consentimientoFirmado: false,
  fusionado: false,
  fechaRegistro: timestamp,
  creadoPor: actorUid
});

// Construye una identidad de cliente
export const buildAppointmentIdentityDocument = ({
  actorUid,
  clientId,
  identity,
  timestamp
}) => ({
  clienteId: clientId,
  tipo: identity.type,
  valorNormalizado: identity.value,
  creadaEn: timestamp,
  creadaPor: actorUid
});

// Construye las partes persistentes del anticipo
const buildStoredDeposit = (deposit) => (
  deposit.payments.map(buildStoredDepositPart)
);

// Construye una cita confirmada
export const buildAppointmentDocument = ({
  actorUid,
  client,
  clientId,
  deposit,
  interval,
  service,
  slotId,
  timestamp,
  toTimestamp
}) => {
  // Construye las partes financieras
  const storedPayments = buildStoredDeposit(deposit);

  // Devuelve la fotografía completa de la cita
  return {
    clienteId: clientId,
    nombreCompleto: client.fullName,
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
    estado: 'confirmada',
    anticipoPagado: true,
    anticipoPorcentaje: service.depositPercentage,
    anticipoMontoCentavos: deposit.amountCents,
    anticipoMetodo: deposit.method,
    anticipoPagos: storedPayments,
    recordatorioEnviado: false,
    creadaEn: timestamp,
    creadaPor: actorUid,
    schemaVersion: 3
  };
};

// Construye la ocupación exclusiva del horario
export const buildAppointmentSlotDocument = ({
  actorUid,
  appointmentId,
  clientId,
  interval,
  service,
  timestamp,
  toTimestamp
}) => ({
  citaId: appointmentId,
  clienteId: clientId,
  fecha: interval.dateKey,
  hora: interval.time,
  inicio: toTimestamp(interval.start),
  finBloque: toTimestamp(interval.blockEnd),
  duracionBloqueMinutos: service.blockDurationMinutes,
  creadoEn: timestamp,
  creadoPor: actorUid,
  schemaVersion: 3
});

// Construye el movimiento financiero del anticipo
export const buildAppointmentPaymentDocument = ({
  actorUid,
  appointmentId,
  clientId,
  deposit,
  timestamp
}) => ({
  citaId: appointmentId,
  ventaId: null,
  clienteId: clientId,
  tipo: 'anticipo',
  metodo: deposit.method,
  montoCentavos: deposit.amountCents,
  partes: buildStoredDeposit(deposit),
  estado: 'confirmado',
  fecha: timestamp,
  actorUid,
  sucursalId: 'principal',
  schemaVersion: 1
});
