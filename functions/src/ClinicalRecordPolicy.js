import { createHash } from 'node:crypto';
import {
  failClinicalRecord,
  normalizeHistory,
  normalizePersonalDetails,
  normalizePrecautions,
  normalizeSkinAnalysis,
  requireCompletedRecord
} from './ClinicalRecordFieldPolicy.js';

const requestFields = [
  'appointmentId',
  'clientId',
  'expectedRevision',
  'operationId',
  'record',
  'status'
];

// Normaliza un identificador documental
const requireIdentifier = (value, label) => {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) {
    failClinicalRecord('invalid-argument', `${label} no es válido`);
  }

  return normalized;
};

// Valida una revisión optimista
const requireRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    failClinicalRecord('invalid-argument', 'La revisión no es válida');
  }

  return value;
};

// Valida y normaliza la solicitud completa
export const validateClinicalRecordRequest = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data)
    ? data
    : {};

  if (
    Object.keys(source).length !== requestFields.length
    || requestFields.some((field) => !Object.hasOwn(source, field))
  ) {
    failClinicalRecord('invalid-argument', 'La solicitud contiene información no permitida');
  }

  if (!['draft', 'completed'].includes(source.status)) {
    failClinicalRecord('invalid-argument', 'El estado de la ficha no es válido');
  }

  const recordSource = source.record && typeof source.record === 'object'
    ? source.record
    : {};
  const recordFields = ['personalDetails', 'history', 'precautions', 'skinAnalysis'];

  if (
    Object.keys(recordSource).length !== recordFields.length
    || recordFields.some((field) => !Object.hasOwn(recordSource, field))
  ) {
    failClinicalRecord('invalid-argument', 'La ficha está incompleta');
  }

  const record = {
    history: normalizeHistory(recordSource.history),
    personalDetails: normalizePersonalDetails(recordSource.personalDetails),
    precautions: normalizePrecautions(recordSource.precautions),
    skinAnalysis: normalizeSkinAnalysis(recordSource.skinAnalysis)
  };

  if (source.status === 'completed') {
    requireCompletedRecord(record);
  }

  return {
    appointmentId: requireIdentifier(source.appointmentId, 'La cita'),
    clientId: requireIdentifier(source.clientId, 'La clienta'),
    expectedRevision: requireRevision(source.expectedRevision),
    operationId: requireIdentifier(source.operationId, 'La operación'),
    record,
    status: source.status
  };
};

// Resume el contenido de una operación
export const buildClinicalRecordRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
