import {
  validateManagementRequest
} from '../src/AppointmentManagementPolicy.js';
import {
  runAppointmentManagementTransaction
} from '../src/AppointmentManagementTransaction.js';
import {
  buildAppointmentSeed,
  FakeAppointmentFirestore
} from './AppointmentTransactionFixture.js';

// Define identidades estables
export const managementIds = Object.freeze({
  appointmentId: 'appointment-managed',
  clientId: 'client-managed',
  slotId: '2026-08-04_10:00'
});

// Define un reloj determinista
const timestamp = () => 'SERVER_TIMESTAMP';

// Construye una cita operativa
export const buildManagementAppointment = (
  state = 'por_confirmar',
  overrides = {}
) => ({
  estado: state,
  clienteId: managementIds.clientId,
  cupoId: managementIds.slotId,
  inicio: new Date('2026-08-04T16:00:00.000Z'),
  anticipoPagado: true,
  anticipoMontoCentavos: 13_500,
  contactoConfirmacion: {
    canal: 'llamada',
    estado: 'pendiente',
    requiereLlamada: true,
    solicitudEnviada: false
  },
  schemaVersion: 3,
  ...overrides
});

// Construye la base aislada
export const buildManagementFirestore = (
  state = 'por_confirmar',
  {
    appointmentOverrides = {},
    clientOverrides = {}
  } = {}
) => new FakeAppointmentFirestore(buildAppointmentSeed({
  [`citas/${managementIds.appointmentId}`]:
    buildManagementAppointment(state, appointmentOverrides),
  [`clientes/${managementIds.clientId}`]: {
    emailNormalizado: 'cliente@example.com',
    fusionado: false,
    ...clientOverrides
  },
  [`cupos/${managementIds.slotId}`]: {
    citaId: managementIds.appointmentId
  }
}));

// Ejecuta una accion validada
export const manageAppointment = ({
  action,
  actorUid = 'actor',
  firestore,
  now = new Date('2026-08-04T15:00:00.000Z'),
  ...details
}) => runAppointmentManagementTransaction({
  actorUid,
  firestore,
  now,
  request: validateManagementRequest({
    appointmentId: managementIds.appointmentId,
    action,
    ...details
  }),
  serverTimestamp: timestamp
});

