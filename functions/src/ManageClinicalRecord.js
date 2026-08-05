import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { ClinicalRecordError } from './ClinicalRecordFieldPolicy.js';
import {
  buildClinicalRecordRequestHash,
  validateClinicalRecordRequest
} from './ClinicalRecordPolicy.js';
import {
  runManageClinicalRecordTransaction
} from './ManageClinicalRecordTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;

  if (error instanceof ClinicalRecordError) {
    return new HttpsError(error.code, error.message);
  }

  return new HttpsError('internal', 'No se pudo guardar la ficha clínica');
};

// Coordina autenticación validación y persistencia
export const manageClinicalRecordHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para guardar la ficha');
  }

  let request;

  try {
    request = validateClinicalRecordRequest(data);

    return await runManageClinicalRecordTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildClinicalRecordRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);

    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al guardar ficha clínica', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        clientId: request?.clientId ?? null,
        errorCode: error?.code ?? null,
        errorName: error?.name ?? 'Error'
      });
    }

    throw mappedError;
  }
};
