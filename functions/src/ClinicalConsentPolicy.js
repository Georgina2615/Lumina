import { createHash } from 'node:crypto';
import {
  clinicalConsentTemplate,
  clinicalConsentTemplateHash
} from './ClinicalConsentTemplate.js';

// Representa un error esperado del consentimiento
export class ClinicalConsentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ClinicalConsentError';
    this.code = code;
  }
}

// Detiene una solicitud inválida
export const failClinicalConsent = (code, message) => {
  throw new ClinicalConsentError(code, message);
};

// Normaliza un identificador seguro
const requireIdentifier = (value, label) => {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value)) {
    failClinicalConsent('invalid-argument', `${label} no es válida`);
  }
  return value;
};

// Valida los campos exactos de una solicitud
const requireExactFields = (source, fields) => {
  if (
    !source
    || typeof source !== 'object'
    || Array.isArray(source)
    || Object.keys(source).length !== fields.length
    || fields.some((field) => !Object.hasOwn(source, field))
  ) {
    failClinicalConsent('invalid-argument', 'La solicitud de consentimiento está incompleta');
  }
};

// Valida la consulta del consentimiento
export const validateClinicalConsentLoadRequest = (data) => {
  requireExactFields(data, ['action', 'appointmentId', 'clientId']);
  if (data.action !== 'load') {
    failClinicalConsent('invalid-argument', 'La acción no es válida');
  }
  return {
    action: 'load',
    appointmentId: requireIdentifier(data.appointmentId, 'La cita'),
    clientId: requireIdentifier(data.clientId, 'La clienta')
  };
};

// Valida la firma del consentimiento
export const validateClinicalConsentSignRequest = (data) => {
  requireExactFields(data, [
    'acceptedStatementIds', 'action', 'appointmentId', 'clientId',
    'clinicalPhotosAllowed', 'marketingPhotosAllowed', 'operationId',
    'signaturePath', 'templateHash', 'templateId'
  ]);
  if (data.action !== 'sign') {
    failClinicalConsent('invalid-argument', 'La acción no es válida');
  }

  const appointmentId = requireIdentifier(data.appointmentId, 'La cita');
  const clientId = requireIdentifier(data.clientId, 'La clienta');
  const requiredIds = clinicalConsentTemplate.statements.map(({ id }) => id);
  const acceptedIds = Array.isArray(data.acceptedStatementIds)
    ? [...data.acceptedStatementIds]
    : [];

  if (
    acceptedIds.length !== requiredIds.length
    || new Set(acceptedIds).size !== requiredIds.length
    || requiredIds.some((id) => !acceptedIds.includes(id))
  ) {
    failClinicalConsent('failed-precondition', 'Acepta todas las declaraciones obligatorias');
  }
  if (
    typeof data.clinicalPhotosAllowed !== 'boolean'
    || typeof data.marketingPhotosAllowed !== 'boolean'
  ) {
    failClinicalConsent('invalid-argument', 'Elige una opción para el uso de fotografías');
  }
  if (
    data.templateId !== clinicalConsentTemplate.id
    || data.templateHash !== clinicalConsentTemplateHash
  ) {
    failClinicalConsent('failed-precondition', 'El consentimiento cambió y debe volver a cargarse');
  }

  const signaturePath = `consentimientos-clinicos/${clientId}/${appointmentId}/firma.webp`;
  if (data.signaturePath !== signaturePath) {
    failClinicalConsent('invalid-argument', 'La firma no corresponde con esta cita');
  }

  return {
    acceptedStatementIds: requiredIds,
    action: 'sign',
    appointmentId,
    clientId,
    clinicalPhotosAllowed: data.clinicalPhotosAllowed,
    marketingPhotosAllowed: data.marketingPhotosAllowed,
    operationId: requireIdentifier(data.operationId, 'La operación'),
    signaturePath,
    templateHash: data.templateHash,
    templateId: data.templateId
  };
};

// Construye una huella estable para reintentos
export const buildClinicalConsentRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);

// Calcula la edad en la fecha de la cita
export const calculateAgeOnDate = (birthDate, appointmentDate) => {
  if (
    typeof birthDate !== 'string'
    || typeof appointmentDate !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)
    || !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate)
  ) {
    failClinicalConsent('failed-precondition', 'Completa la fecha de nacimiento en la ficha técnica');
  }
  const [birthYear, birthMonth, birthDay] = birthDate.split('-').map(Number);
  const [year, month, day] = appointmentDate.split('-').map(Number);
  let age = year - birthYear;
  if (month < birthMonth || (month === birthMonth && day < birthDay)) age -= 1;
  return age;
};
