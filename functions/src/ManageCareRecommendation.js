import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { CareRecommendationError } from './CareRecommendationError.js';
import {
  buildCareRecommendationRequestHash,
  validateCareRecommendationRequest
} from './CareRecommendationPolicy.js';
import { runManageCareRecommendationTransaction } from './ManageCareRecommendationTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof CareRecommendationError) return new HttpsError(error.code, error.message);
  return new HttpsError('internal', 'No pudimos guardar las recomendaciones');
};

// Coordina la recomendación de cuidado de una cita
export const manageCareRecommendationHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para guardar recomendaciones');
  }
  let request;
  try {
    request = validateCareRecommendationRequest(data);
    return await runManageCareRecommendationTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildCareRecommendationRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al guardar recomendaciones de cuidado', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
