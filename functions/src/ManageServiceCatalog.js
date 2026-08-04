import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildServiceCatalogRequestHash,
  ServiceCatalogError,
  validateManageServiceCatalogRequest
} from './ServiceCatalogPolicy.js';
import {
  runManageServiceCatalogTransaction
} from './ManageServiceCatalogTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) {
    return error;
  }

  if (error instanceof ServiceCatalogError) {
    return new HttpsError(error.code, error.message);
  }

  return new HttpsError('internal', 'No se pudo administrar el servicio');
};

// Coordina autenticacion validacion y persistencia
export const manageServiceCatalogHandler = async ({
  auth,
  data,
  firestore
}) => {
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para administrar servicios'
    );
  }

  let request;

  try {
    request = validateManageServiceCatalogRequest(data);

    return await runManageServiceCatalogTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildServiceCatalogRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);

    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al administrar servicio', {
        actorUid: auth.uid,
        action: request?.action ?? null,
        serviceId: request?.serviceId ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }

    throw mappedError;
  }
};
