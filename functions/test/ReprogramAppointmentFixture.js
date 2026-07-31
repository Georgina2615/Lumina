import {
  validateReprogramRequest
} from '../src/ReprogramAppointmentRequestPolicy.js';
import {
  runReprogramAppointmentTransaction
} from '../src/ReprogramAppointmentTransaction.js';
import {
  buildAppointmentSeed,
  FakeAppointmentFirestore
} from './AppointmentTransactionFixture.js';

// Define identidades estables
export const reprogramIds = Object.freeze({
  actorId: 'actor',
  clientId: 'client-reprogram',
  sourceId: 'appointment-source'
});

// Define una parte original en efectivo
export const sourceDepositPart = Object.freeze({
  metodo: 'efectivo',
  montoCentavos: 13_500,
  efectivoRecibidoCentavos: 13_500,
  cambioCentavos: 0,
  referencia: '',
  ultimosCuatro: ''
});

// Construye la cita fuente disponible
export const buildReprogramSource = (overrides = {}) => ({
  schemaVersion: 3,
  estado: 'cancelada',
  clienteId: reprogramIds.clientId,
  cupoId: '2026-08-01_17:00',
  servicioId: 'limpieza-profunda',
  servicio: 'Limpieza facial profunda',
  precioServicioCentavos: 45_000,
  anticipoPagado: true,
  anticipoPorcentaje: 30,
  anticipoMontoCentavos: 13_500,
  anticipoMetodo: 'efectivo',
  anticipoPagos: [sourceDepositPart],
  contactoConfirmacion: {
    canal: 'correo',
    estado: 'pendiente',
    requiereLlamada: false,
    solicitudEnviada: false
  },
  cancelacion: {
    origen: 'clinica',
    motivo: 'Mantenimiento',
    anticipoResultado: 'disponible_reprogramacion',
    reprogramacionDisponible: true
  },
  reprogramacion: {
    estado: 'disponible',
    anticipoDisponibleCentavos: 13_500
  },
  ...overrides
});

// Construye el pago original
export const buildSourcePayment = (overrides = {}) => ({
  schemaVersion: 1,
  tipo: 'anticipo',
  estado: 'confirmado',
  citaId: reprogramIds.sourceId,
  ventaId: null,
  clienteId: reprogramIds.clientId,
  metodo: 'efectivo',
  montoCentavos: 13_500,
  partes: [sourceDepositPart],
  sucursalId: 'principal',
  fecha: 'ORIGINAL_TIMESTAMP',
  actorUid: reprogramIds.actorId,
  ...overrides
});

// Construye la base aislada
export const buildReprogramFirestore = ({
  paymentOverrides = {},
  sourceOverrides = {}
} = {}) => new FakeAppointmentFirestore(buildAppointmentSeed({
  'servicios/anti-edad': {
    activo: true,
    nombre: 'Anti edad',
    precioCentavos: 65_000,
    duracionServicioMinutos: 150,
    tiempoPreparacionMinutos: 30,
    duracionBloqueMinutos: 180,
    porcentajeAnticipo: 30
  },
  [`clientes/${reprogramIds.clientId}`]: {
    nombreCompleto: 'Mariana Escobedo',
    telefonoNormalizado: '9811017687',
    emailNormalizado: 'mariana@example.com',
    fusionado: false
  },
  [`citas/${reprogramIds.sourceId}`]:
    buildReprogramSource(sourceOverrides),
  [`pagos/${reprogramIds.sourceId}_anticipo`]:
    buildSourcePayment(paymentOverrides)
}));

// Construye la solicitud pública
export const buildReprogramRequestData = (overrides = {}) => ({
  sourceAppointmentId: reprogramIds.sourceId,
  serviceId: 'limpieza-profunda',
  dateKey: '2026-08-04',
  time: '10:00',
  ...overrides
});

// Ejecuta una reprogramación validada
export const reprogramAppointment = ({
  actorUid = reprogramIds.actorId,
  firestore,
  now = new Date('2026-07-30T18:00:00.000Z'),
  requestData = buildReprogramRequestData(),
  serverTimestamp = () => 'SERVER_TIMESTAMP',
  toTimestamp = (date) => date.toISOString()
}) => runReprogramAppointmentTransaction({
  actorUid,
  firestore,
  now,
  request: validateReprogramRequest(requestData, now),
  serverTimestamp,
  toTimestamp
});
