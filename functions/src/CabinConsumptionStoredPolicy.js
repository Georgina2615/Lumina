import { CabinInventoryError } from './CabinInventoryError.js';

// Detiene una operación incompatible
const fail = (code, message) => {
  throw new CabinInventoryError(code, message);
};

// Exige una cosmetóloga activa
export const requireCabinConsumptionActor = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'cosmetologa') {
    fail('permission-denied', 'Tu cuenta no puede registrar insumos utilizados');
  }
};

// Exige la cita activa de la misma clienta
export const requireCabinConsumptionAppointment = ({ appointmentId, clientId, snapshot }) => {
  const appointment = snapshot.exists ? snapshot.data() : null;
  if (
    !appointment
    || snapshot.id !== appointmentId
    || appointment.clienteId !== clientId
    || appointment.estado !== 'en_cabina'
  ) fail('failed-precondition', 'La cita debe estar en cabina para registrar insumos');
  return appointment;
};

// Exige una clienta vigente
export const requireCabinConsumptionClient = (snapshot, clientId) => {
  const client = snapshot.exists ? snapshot.data() : null;
  if (!client || snapshot.id !== clientId || client.fusionado === true) {
    fail('not-found', 'La clienta ya no está disponible');
  }
};

// Exige consentimiento y seguimiento terminados
export const requireCabinConsumptionClinicalWork = ({ consentSnapshot, sessionSnapshot, appointmentId, clientId }) => {
  const consent = consentSnapshot.exists ? consentSnapshot.data() : null;
  const session = sessionSnapshot.exists ? sessionSnapshot.data() : null;
  if (
    consent?.appointmentId !== appointmentId
    || consent?.clientId !== clientId
    || consent?.status !== 'signed'
  ) fail('failed-precondition', 'Firma el consentimiento antes de registrar insumos');
  if (
    session?.appointmentId !== appointmentId
    || session?.clientId !== clientId
    || session?.status !== 'completed'
  ) fail('failed-precondition', 'Completa el seguimiento antes de registrar insumos');
};

// Recupera un reintento o impide un segundo consumo
export const getExistingCabinConsumption = ({ operationId, requestHash, snapshot }) => {
  if (!snapshot.exists) return null;
  const operation = snapshot.data().lastOperation;
  if (operation?.id === operationId && operation?.requestHash === requestHash) {
    return operation.result;
  }
  fail('already-exists', 'Los insumos de esta cita ya fueron registrados');
};
