import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import {
  validatePublicRequestReview
} from './PublicRequestReviewPolicy.js';
import {
  runPublicRequestReviewTransaction
} from './PublicRequestReviewTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof AppointmentError) {
    return new HttpsError(error.code, error.message);
  }
  return new HttpsError('internal', 'No se pudo revisar la solicitud');
};

// Coordina la revisión segura de solicitudes
export const reviewPublicAppointmentRequestHandler = async ({
  auth,
  data,
  firestore,
  now = new Date()
}) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para revisar solicitudes');
  }

  let command;
  try {
    command = validatePublicRequestReview(data);
    return await runPublicRequestReviewTransaction({
      actorUid: auth.uid,
      command,
      firestore,
      now
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al revisar solicitud pública', {
        actorUid: auth.uid,
        requestId: command?.requestId ?? null,
        action: command?.action ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
