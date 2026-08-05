import { createHash } from 'node:crypto';
import {
  failClinicalSession,
  normalizeClinicalSessionPhotos,
  normalizeClinicalSessionText,
  requireClinicalSessionIdentifier,
  requireClinicalSessionRevision,
  requireCompletedClinicalSession,
  requireExactObject
} from './ClinicalSessionFieldPolicy.js';

const requestFields = [
  'appointmentId',
  'clientId',
  'expectedRevision',
  'operationId',
  'session',
  'status'
];

// Valida y normaliza una solicitud de seguimiento
export const validateClinicalSessionRequest = (data) => {
  const source = requireExactObject(data, requestFields, 'La solicitud');

  if (!['draft', 'completed'].includes(source.status)) {
    failClinicalSession('invalid-argument', 'El estado del seguimiento no es válido');
  }

  const appointmentId = requireClinicalSessionIdentifier(source.appointmentId, 'La cita');
  const clientId = requireClinicalSessionIdentifier(source.clientId, 'La clienta');
  const sessionSource = requireExactObject(source.session, [
    'afterObservations',
    'beforeObservations',
    'performedTreatment',
    'photoConsentGranted',
    'photos'
  ], 'El seguimiento');
  const photos = normalizeClinicalSessionPhotos({
    appointmentId,
    clientId,
    source: sessionSource.photos
  });

  if (typeof sessionSource.photoConsentGranted !== 'boolean') {
    failClinicalSession('invalid-argument', 'La autorización de fotografías no es válida');
  }
  if ((photos.beforePath || photos.afterPath) && !sessionSource.photoConsentGranted) {
    failClinicalSession('failed-precondition', 'Registra la autorización antes de guardar fotografías');
  }

  const session = {
    afterObservations: normalizeClinicalSessionText(
      sessionSource.afterObservations,
      'Las observaciones finales',
      2000
    ),
    beforeObservations: normalizeClinicalSessionText(
      sessionSource.beforeObservations,
      'Las observaciones iniciales',
      2000
    ),
    performedTreatment: normalizeClinicalSessionText(
      sessionSource.performedTreatment,
      'El tratamiento realizado',
      1000
    ),
    photoConsentGranted: sessionSource.photoConsentGranted,
    photos
  };

  if (source.status === 'completed') {
    requireCompletedClinicalSession(session);
  }

  return {
    appointmentId,
    clientId,
    expectedRevision: requireClinicalSessionRevision(source.expectedRevision),
    operationId: requireClinicalSessionIdentifier(source.operationId, 'La operación'),
    session,
    status: source.status
  };
};

// Resume el contenido estable de una operación
export const buildClinicalSessionRequestHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
