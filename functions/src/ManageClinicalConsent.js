import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildClinicalConsentRequestHash,
  ClinicalConsentError,
  failClinicalConsent,
  validateClinicalConsentLoadRequest,
  validateClinicalConsentSignRequest
} from './ClinicalConsentPolicy.js';
import { runManageClinicalConsentTransaction } from './ManageClinicalConsentTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof ClinicalConsentError) return new HttpsError(error.code, error.message);
  return new HttpsError('internal', 'No pudimos gestionar el consentimiento');
};

// Comprueba que la firma privada terminó de subir
const requireStoredSignature = async ({ signaturePath, storage }) => {
  let metadata;
  try {
    [metadata] = await storage.bucket().file(signaturePath).getMetadata();
  } catch (error) {
    if (error?.code === 404) {
      failClinicalConsent('not-found', 'La firma todavía no terminó de subir');
    }
    throw error;
  }
  const size = Number(metadata.size);
  if (metadata.contentType !== 'image/webp' || size <= 0 || size > 250 * 1024) {
    failClinicalConsent('failed-precondition', 'La firma no cumple el formato privado requerido');
  }
};

// Coordina consulta firma y persistencia protegida
export const manageClinicalConsentHandler = async ({ auth, data, firestore, storage }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para gestionar el consentimiento');
  }
  let request;
  try {
    request = data?.action === 'sign'
      ? validateClinicalConsentSignRequest(data)
      : validateClinicalConsentLoadRequest(data);
    if (request.action === 'sign') {
      await requireStoredSignature({ signaturePath: request.signaturePath, storage });
    }
    return await runManageClinicalConsentTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildClinicalConsentRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al gestionar consentimiento clínico', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
