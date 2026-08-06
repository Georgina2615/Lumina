import { ClinicalCompletionError } from './ClinicalCompletionError.js';

// Detiene una operación incompatible
const fail = (code, message) => {
  throw new ClinicalCompletionError(code, message);
};

// Exige una cosmetóloga activa
export const requireClinicalCompletionActor = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'cosmetologa') {
    fail('permission-denied', 'Tu cuenta no puede terminar atenciones');
  }
};

// Exige una cita vigente y detecta reintentos
export const requireClinicalCompletionAppointment = ({ appointmentId, snapshot }) => {
  const appointment = snapshot.exists ? snapshot.data() : null;
  if (!appointment || snapshot.id !== appointmentId || appointment.schemaVersion !== 3) {
    fail('not-found', 'La cita no está disponible');
  }
  if (appointment.estado === 'por_cobrar') return { appointment, isRetry: true };
  if (appointment.estado !== 'en_cabina') {
    fail('failed-precondition', 'La cita debe estar en cabina para terminar la atención');
  }
  if (typeof appointment.clienteId !== 'string' || !appointment.clienteId) {
    fail('failed-precondition', 'La cita no tiene una clienta válida');
  }
  return { appointment, isRetry: false };
};

// Exige el cupo reservado de la cita
export const requireClinicalCompletionSlot = ({ appointmentId, snapshot }) => {
  if (!snapshot.exists || snapshot.data().citaId !== appointmentId) {
    fail('failed-precondition', 'El horario reservado de la cita no es válido');
  }
};

// Exige todos los documentos clínicos terminados
export const requireCompletedClinicalDocuments = ({
  appointmentId,
  clientId,
  consentSnapshot,
  consumptionSnapshot,
  recommendationSnapshot,
  recordSnapshot,
  sessionSnapshot
}) => {
  const record = recordSnapshot.exists ? recordSnapshot.data() : null;
  const consent = consentSnapshot.exists ? consentSnapshot.data() : null;
  const session = sessionSnapshot.exists ? sessionSnapshot.data() : null;
  const consumption = consumptionSnapshot.exists ? consumptionSnapshot.data() : null;
  const recommendation = recommendationSnapshot.exists ? recommendationSnapshot.data() : null;
  if (record?.clientId !== clientId || record?.status !== 'completed' || record?.lastAppointmentId !== appointmentId) {
    fail('failed-precondition', 'Confirma la ficha técnica para esta cita antes de terminar la atención');
  }
  if (consent?.appointmentId !== appointmentId || consent?.clientId !== clientId || consent?.status !== 'signed') {
    fail('failed-precondition', 'Firma el consentimiento antes de terminar la atención');
  }
  if (session?.appointmentId !== appointmentId || session?.clientId !== clientId || session?.status !== 'completed') {
    fail('failed-precondition', 'Completa el seguimiento antes de terminar la atención');
  }
  if (consumption?.appointmentId !== appointmentId || consumption?.clientId !== clientId || consumption?.status !== 'recorded') {
    fail('failed-precondition', 'Registra los insumos utilizados antes de terminar la atención');
  }
  if (recommendation?.appointmentId !== appointmentId || recommendation?.clientId !== clientId || recommendation?.status !== 'saved') {
    fail('failed-precondition', 'Guarda las recomendaciones antes de terminar la atención');
  }
  return { consent, consumption, recommendation, record, session };
};

// Valida un reintento exacto del cierre
export const requireClinicalCompletionRetry = ({ actorUid, operationId, snapshot }) => {
  const event = snapshot.exists ? snapshot.data() : null;
  if (
    event?.accion !== 'finalizar_atencion'
    || event?.actorUid !== actorUid
    || event?.operationId !== operationId
    || event?.estadoNuevo !== 'por_cobrar'
  ) fail('already-exists', 'La atención ya fue enviada a recepción');
};
