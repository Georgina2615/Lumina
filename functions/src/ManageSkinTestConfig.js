import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildSkinTestConfigHash,
  SkinTestConfigError,
  validateSkinTestConfigRequest
} from './SkinTestConfigPolicy.js';
import {
  runManageSkinTestConfigTransaction
} from './ManageSkinTestConfigTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof SkinTestConfigError) {
    return new HttpsError(error.code, error.message);
  }
  return new HttpsError('internal', 'No se pudo guardar el test de piel');
};

// Coordina la configuración segura del test
export const manageSkinTestConfigHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para configurar el test');
  }
  let request;
  try {
    request = validateSkinTestConfigRequest(data);
    return await runManageSkinTestConfigTransaction({
      actorUid: auth.uid,
      firestore,
      hash: buildSkinTestConfigHash(request),
      request
    });
  } catch (error) {
    const mapped = mapError(error);
    if (mapped.code === 'internal') {
      logger.error('Fallo inesperado al configurar test de piel', {
        actorUid: auth.uid,
        errorCode: error?.code ?? null,
        errorName: error?.name ?? 'Error'
      });
    }
    throw mapped;
  }
};
