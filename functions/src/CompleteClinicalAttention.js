import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { ClinicalCompletionError } from './ClinicalCompletionError.js';
import { validateClinicalCompletionRequest } from './ClinicalCompletionPolicy.js';
import { runCompleteClinicalAttentionTransaction } from './CompleteClinicalAttentionTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof ClinicalCompletionError) return new HttpsError(error.code, error.message);
  return new HttpsError('internal', 'No pudimos terminar la atención');
};

// Coordina el cierre seguro de una atención
export const completeClinicalAttentionHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Inicia sesión para terminar la atención');
  let request;
  try {
    request = validateClinicalCompletionRequest(data);
    return await runCompleteClinicalAttentionTransaction({ actorUid: auth.uid, firestore, request });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al terminar atención clínica', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
