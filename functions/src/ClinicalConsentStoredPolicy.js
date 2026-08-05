import { failClinicalConsent, calculateAgeOnDate } from './ClinicalConsentPolicy.js';

// Exige una cuenta clínica activa
export const requireClinicalConsentActor = (snapshot) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (data?.activo !== true || data?.rol !== 'cosmetologa') {
    failClinicalConsent('permission-denied', 'Tu cuenta no puede gestionar consentimientos');
  }
};

// Exige una cita activa de la misma clienta
export const requireClinicalConsentAppointment = ({ appointmentId, clientId, snapshot }) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (
    !data
    || snapshot.id !== appointmentId
    || data.clienteId !== clientId
    || data.estado !== 'en_cabina'
    || typeof data.fecha !== 'string'
  ) {
    failClinicalConsent('failed-precondition', 'La cita debe estar en cabina para firmar el consentimiento');
  }
  return data;
};

// Exige una clienta vigente
export const requireClinicalConsentClient = (snapshot, clientId) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (!data || snapshot.id !== clientId || data.fusionado === true) {
    failClinicalConsent('not-found', 'La clienta ya no está disponible');
  }
  return data;
};

// Exige una ficha completa y una clienta adulta
export const requireAdultCompletedRecord = ({ appointmentDate, clientId, snapshot }) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (!data || data.clientId !== clientId || data.status !== 'completed') {
    failClinicalConsent('failed-precondition', 'Completa la ficha técnica antes del consentimiento');
  }
  const birthDate = data.personalDetails?.birthDate;
  const age = calculateAgeOnDate(birthDate, appointmentDate);
  if (age < 18) {
    failClinicalConsent('failed-precondition', 'Lumina Skin atiende únicamente a personas mayores de edad');
  }
  return { age, birthDate };
};

// Recupera un consentimiento firmado válido
export const requireSignedClinicalConsent = ({ appointmentId, clientId, snapshot }) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (
    !data
    || data.appointmentId !== appointmentId
    || data.clientId !== clientId
    || data.status !== 'signed'
    || data.schemaVersion !== 1
  ) {
    failClinicalConsent('failed-precondition', 'Firma el consentimiento antes de continuar');
  }
  return data;
};
