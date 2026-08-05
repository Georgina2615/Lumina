import { failClinicalSession } from './ClinicalSessionFieldPolicy.js';

// Exige una cuenta de cosmetóloga activa
export const requireClinicalSessionActor = (snapshot) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (data?.activo !== true || data?.rol !== 'cosmetologa') {
    failClinicalSession('permission-denied', 'Tu cuenta no puede guardar seguimientos');
  }
};

// Exige una clienta vigente
export const requireClinicalSessionClient = (snapshot, clientId) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (
    !data
    || snapshot.id !== clientId
    || data.fusionado === true
    || typeof data.nombreCompleto !== 'string'
  ) {
    failClinicalSession('not-found', 'La clienta ya no está disponible');
  }

  return data;
};

// Exige una cita activa de la misma clienta
export const requireClinicalSessionAppointment = ({ appointmentId, clientId, snapshot }) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (
    !data
    || snapshot.id !== appointmentId
    || data.clienteId !== clientId
    || data.estado !== 'en_cabina'
    || typeof data.fecha !== 'string'
    || typeof data.hora !== 'string'
    || typeof data.servicio !== 'string'
  ) {
    failClinicalSession('failed-precondition', 'La cita debe estar en cabina para guardar el seguimiento');
  }

  return data;
};

// Exige una ficha técnica válida antes del seguimiento
export const requireClinicalRecordForSession = ({ clientId, sessionStatus, snapshot }) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (
    !data
    || data.clientId !== clientId
    || data.schemaVersion !== 1
    || !Number.isSafeInteger(data.revision)
  ) {
    failClinicalSession('failed-precondition', 'Crea la ficha técnica antes del seguimiento');
  }

  if (sessionStatus === 'completed' && data.status !== 'completed') {
    failClinicalSession('failed-precondition', 'Completa la ficha técnica antes de terminar el seguimiento');
  }

  return data;
};

// Exige el consentimiento firmado y aplica su decisión de fotografías
export const requireConsentForSession = ({ appointmentId, clientId, session, snapshot }) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (
    !data
    || data.appointmentId !== appointmentId
    || data.clientId !== clientId
    || data.status !== 'signed'
    || data.schemaVersion !== 1
  ) {
    failClinicalSession('failed-precondition', 'Firma el consentimiento antes del seguimiento');
  }
  if (session.photoConsentGranted !== (data.clinicalPhotosAllowed === true)) {
    failClinicalSession('failed-precondition', 'La autorización de fotografías cambió y debe volver a cargarse');
  }
  return data;
};

// Valida el seguimiento almacenado y su revisión
export const requireStoredClinicalSession = ({
  appointmentId,
  clientId,
  expectedRevision,
  snapshot
}) => {
  if (!snapshot.exists) {
    if (expectedRevision !== 0) {
      failClinicalSession('failed-precondition', 'El seguimiento cambió y debe volver a cargarse');
    }
    return null;
  }

  const data = snapshot.data();

  if (
    data.schemaVersion !== 1
    || data.appointmentId !== appointmentId
    || data.clientId !== clientId
    || !Number.isSafeInteger(data.revision)
  ) {
    failClinicalSession('failed-precondition', 'El seguimiento guardado necesita revisión');
  }
  if (data.revision !== expectedRevision) {
    failClinicalSession('failed-precondition', 'El seguimiento cambió en otra ventana y debe volver a cargarse');
  }

  return data;
};

// Recupera un reintento idéntico
export const getExistingClinicalSessionOperation = ({
  operationId,
  requestHash,
  storedSession
}) => {
  const operation = storedSession?.lastOperation;
  if (!operation || operation.id !== operationId) return null;

  if (operation.requestHash !== requestHash) {
    failClinicalSession('already-exists', 'La operación ya se utilizó con información diferente');
  }

  return operation.result;
};

// Impide regresar una sesión completa a borrador
export const requireClinicalSessionStatusTransition = (storedSession, nextStatus) => {
  if (storedSession?.status === 'completed' && nextStatus === 'draft') {
    failClinicalSession('failed-precondition', 'Un seguimiento completo no puede regresar a borrador');
  }
};

// Selecciona el seguimiento terminado más reciente
export const findPreviousClinicalSession = ({ appointmentId, documents }) => (
  documents
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    .filter((session) => (
      session.appointmentId !== appointmentId
      && session.status === 'completed'
      && typeof session.performedTreatment === 'string'
    ))
    .sort((first, second) => {
      const firstTime = typeof first.completedAt?.toMillis === 'function'
        ? first.completedAt.toMillis()
        : 0;
      const secondTime = typeof second.completedAt?.toMillis === 'function'
        ? second.completedAt.toMillis()
        : 0;
      return secondTime - firstTime;
    })[0] ?? null
);
