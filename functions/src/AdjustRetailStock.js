import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  runAdjustRetailStockTransaction
} from './AdjustRetailStockTransaction.js';
import { RetailInventoryError } from './RetailInventoryError.js';
import {
  buildRetailInventoryRequestHash,
  validateAdjustRetailStockRequest
} from './RetailInventoryRequestPolicy.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) {
    return error;
  }
  if (error instanceof RetailInventoryError) {
    return new HttpsError(error.code, error.message);
  }
  return new HttpsError('internal', 'No se pudo ajustar el inventario');
};

// Coordina autenticación validación y persistencia
export const adjustRetailStockHandler = async ({
  auth,
  data,
  firestore
}) => {
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para administrar inventario'
    );
  }
  let request;
  try {
    request = validateAdjustRetailStockRequest(data);
    return await runAdjustRetailStockTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildRetailInventoryRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al ajustar inventario', {
        actorUid: auth.uid,
        type: request?.type ?? null,
        productId: request?.productId ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
