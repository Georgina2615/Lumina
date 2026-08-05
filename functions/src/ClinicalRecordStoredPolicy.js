import { failClinicalRecord } from './ClinicalRecordFieldPolicy.js';

// Exige una cuenta clínica activa
export const requireClinicalActor = (snapshot) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (data?.activo !== true || data?.rol !== 'cosmetologa') {
    failClinicalRecord('permission-denied', 'Tu cuenta no puede guardar fichas clínicas');
  }
};

// Exige una clienta vigente
export const requireClinicalClient = (snapshot, clientId) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (
    !data
    || data.fusionado === true
    || typeof data.nombreCompleto !== 'string'
    || snapshot.id !== clientId
  ) {
    failClinicalRecord('not-found', 'La clienta ya no está disponible');
  }
};

// Exige una cita activa de la misma clienta
export const requireActiveClinicalAppointment = ({ snapshot, appointmentId, clientId }) => {
  const data = snapshot.exists ? snapshot.data() : null;

  if (
    !data
    || snapshot.id !== appointmentId
    || data.clienteId !== clientId
    || data.estado !== 'en_cabina'
  ) {
    failClinicalRecord('failed-precondition', 'La cita debe estar en cabina para guardar la ficha');
  }
};

// Valida una ficha almacenada y su revisión
export const requireStoredClinicalRecord = ({ snapshot, clientId, expectedRevision }) => {
  if (!snapshot.exists) {
    if (expectedRevision !== 0) {
      failClinicalRecord('failed-precondition', 'La ficha cambió y debe volver a cargarse');
    }

    return null;
  }

  const data = snapshot.data();

  if (
    data.schemaVersion !== 1
    || data.clientId !== clientId
    || !Number.isSafeInteger(data.revision)
  ) {
    failClinicalRecord('failed-precondition', 'La ficha guardada necesita revisión');
  }

  if (data.revision !== expectedRevision) {
    failClinicalRecord('failed-precondition', 'La ficha cambió en otra ventana y debe volver a cargarse');
  }

  return data;
};

// Impide regresar una ficha completa a borrador
export const requireClinicalRecordStatusTransition = (storedRecord, nextStatus) => {
  if (storedRecord?.status === 'completed' && nextStatus === 'draft') {
    failClinicalRecord('failed-precondition', 'Una ficha completa no puede regresar a borrador');
  }
};

// Recupera un reintento idéntico
export const getExistingClinicalOperation = ({ storedRecord, operationId, requestHash }) => {
  const operation = storedRecord?.lastOperation;

  if (!operation || operation.id !== operationId) return null;

  if (operation.requestHash !== requestHash) {
    failClinicalRecord('already-exists', 'La operación ya se utilizó con información diferente');
  }

  return operation.result;
};
