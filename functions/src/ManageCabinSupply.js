import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { CabinInventoryError } from './CabinInventoryError.js';
import {
  buildCabinInventoryRequestHash,
  validateManageCabinSupplyRequest
} from './CabinInventoryRequestPolicy.js';
import {
  runManageCabinSupplyTransaction
} from './ManageCabinSupplyTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) {
    return error;
  }
  if (error instanceof CabinInventoryError) {
    return new HttpsError(error.code, error.message);
  }
  return new HttpsError(
    'internal',
    'No se pudo administrar el inventario de cabina'
  );
};

// Coordina autenticación validación y persistencia
export const manageCabinSupplyHandler = async ({
  auth,
  data,
  firestore
}) => {
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para administrar inventario de cabina'
    );
  }
  let request;
  try {
    request = validateManageCabinSupplyRequest(data);
    return await runManageCabinSupplyTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildCabinInventoryRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al administrar insumo de cabina', {
        actorUid: auth.uid,
        action: request?.action ?? null,
        supplyId: request?.supplyId ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
