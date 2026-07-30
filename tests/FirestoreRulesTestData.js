import {
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Define identidades estables del proyecto local
export const testIds = Object.freeze({
  appointmentId: 'cita_reglas_2ca',
  clientId: 'cliente_reglas_2ca',
  serviceId: 'limpieza-facial-profunda',
  slotId: '2030-07-01_10:00',
  userId: 'recepcion_reglas_2ca'
});

// Define el intervalo futuro de la cita
const appointmentStart = Timestamp.fromDate(
  new Date('2030-07-01T16:00:00.000Z')
);
const treatmentEnd = Timestamp.fromDate(
  new Date('2030-07-01T18:30:00.000Z')
);
const blockEnd = Timestamp.fromDate(
  new Date('2030-07-01T19:00:00.000Z')
);

// Construye el servicio canónico
export const buildTestService = () => ({
  nombre: 'Limpieza facial profunda',
  precioCentavos: 45000,
  duracionServicioMinutos: 150,
  tiempoPreparacionMinutos: 30,
  duracionBloqueMinutos: 180,
  porcentajeAnticipo: 30,
  activo: true,
  orden: 1
});

// Construye el cliente canónico
export const buildTestClient = ({
  actorUid = 'datos_emulador',
  timestamp = Timestamp.now()
} = {}) => ({
  nombreCompleto: 'Cliente de reglas',
  telefono: '9991112233',
  telefonoNormalizado: '9991112233',
  email: 'reglas@example.com',
  emailNormalizado: 'reglas@example.com',
  consentimientoFirmado: false,
  fusionado: false,
  fechaRegistro: timestamp,
  creadoPor: actorUid
});

// Construye una identidad del cliente
export const buildTestIdentity = (type, value, {
  actorUid = 'datos_emulador',
  timestamp = Timestamp.now()
} = {}) => ({
  tipo: type,
  valorNormalizado: value,
  clienteId: testIds.clientId,
  creadaEn: timestamp,
  creadaPor: actorUid
});

// Construye el pago incrustado del anticipo
export const buildEmbeddedDeposit = () => ({
  metodo: 'efectivo',
  montoCentavos: 13500,
  efectivoRecibidoCentavos: 15000,
  cambioCentavos: 1500,
  referencia: '',
  ultimosCuatro: ''
});

// Construye dos partes exactas del anticipo
export const buildMixedEmbeddedDeposit = () => ([
  {
    metodo: 'efectivo',
    montoCentavos: 5000,
    efectivoRecibidoCentavos: 5000,
    cambioCentavos: 0,
    referencia: '',
    ultimosCuatro: ''
  },
  {
    metodo: 'transferencia',
    montoCentavos: 8500,
    efectivoRecibidoCentavos: 0,
    cambioCentavos: 0,
    referencia: 'SPEI-REGLAS',
    ultimosCuatro: ''
  }
]);

// Construye la cita vigente
export const buildTestAppointment = ({
  actorUid = testIds.userId,
  depositPayments = [buildEmbeddedDeposit()],
  state = 'confirmada',
  timestamp = serverTimestamp()
} = {}) => ({
  clienteId: testIds.clientId,
  nombreCompleto: 'Cliente de reglas',
  servicioId: testIds.serviceId,
  servicio: 'Limpieza facial profunda',
  precioServicio: 450,
  precioServicioCentavos: 45000,
  duracionMinutos: 180,
  duracionServicioMinutos: 150,
  tiempoPreparacionMinutos: 30,
  duracionBloqueMinutos: 180,
  fecha: '2030-07-01',
  hora: '10:00',
  inicio: appointmentStart,
  finTratamiento: treatmentEnd,
  finBloque: blockEnd,
  estado: state,
  anticipoPagado: true,
  anticipoPorcentaje: 30,
  anticipoMontoCentavos: depositPayments.reduce(
    (total, payment) => total + payment.montoCentavos,
    0
  ),
  anticipoMetodo: depositPayments.length === 2
    ? 'mixto'
    : depositPayments[0].metodo,
  anticipoPagos: depositPayments,
  recordatorioEnviado: false,
  cupoId: testIds.slotId,
  creadaEn: timestamp,
  creadaPor: actorUid,
  schemaVersion: 3
});

// Construye el cupo relacionado
export const buildTestSlot = ({
  actorUid = testIds.userId,
  appointmentId = testIds.appointmentId,
  timestamp = serverTimestamp()
} = {}) => ({
  citaId: appointmentId,
  clienteId: testIds.clientId,
  fecha: '2030-07-01',
  hora: '10:00',
  inicio: appointmentStart,
  finBloque: blockEnd,
  duracionBloqueMinutos: 180,
  creadoEn: timestamp,
  creadoPor: actorUid,
  schemaVersion: 3
});

// Construye el documento financiero del anticipo
export const buildTestDepositPayment = ({
  actorUid = testIds.userId,
  appointmentId = testIds.appointmentId,
  depositPayments = [buildEmbeddedDeposit()],
  timestamp = serverTimestamp()
} = {}) => ({
  citaId: appointmentId,
  ventaId: null,
  clienteId: testIds.clientId,
  tipo: 'anticipo',
  metodo: depositPayments.length === 2
    ? 'mixto'
    : depositPayments[0].metodo,
  montoCentavos: depositPayments.reduce(
    (total, payment) => total + payment.montoCentavos,
    0
  ),
  partes: depositPayments,
  estado: 'confirmado',
  fecha: timestamp,
  actorUid,
  sucursalId: 'principal',
  schemaVersion: 1
});
