import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { RetailInventoryError } from './RetailInventoryError.js';
import {
  buildRetailInventoryRequestHash,
  validateManageRetailProductRequest
} from './RetailInventoryRequestPolicy.js';
import { requireStoredRetailImage } from './RetailProductImagePolicy.js';
import {
  runManageRetailProductTransaction
} from './ManageRetailProductTransaction.js';
import {
  mapExistingRetailOperation,
  requireRetailAdmin
} from './RetailInventoryStoredPolicy.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) {
    return error;
  }
  if (error instanceof RetailInventoryError) {
    return new HttpsError(error.code, error.message);
  }
  return new HttpsError('internal', 'No se pudo administrar el producto');
};

// Coordina productos autenticación e imagen
export const manageRetailProductHandler = async ({
  auth,
  data,
  downloadUrlResolver,
  firestore,
  storage
}) => {
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para administrar inventario'
    );
  }
  let request;
  try {
    request = validateManageRetailProductRequest(data);
    const requestHash = buildRetailInventoryRequestHash(request);
    if (request.action === 'attach_image') {
      const [actorSnapshot, movementSnapshot] = await firestore.getAll(
        firestore.collection('usuarios').doc(auth.uid),
        firestore.collection('movimientosInventario').doc(request.operationId)
      );
      requireRetailAdmin(actorSnapshot);
      const existing = mapExistingRetailOperation({
        snapshot: movementSnapshot,
        actorUid: auth.uid,
        productId: request.productId,
        requestHash
      });
      if (existing) {
        return existing;
      }
    }
    const image = request.action === 'attach_image'
      ? await requireStoredRetailImage({
        downloadUrlResolver,
        imagePath: request.imagePath,
        storage
      })
      : null;
    return await runManageRetailProductTransaction({
      actorUid: auth.uid,
      firestore,
      image,
      request,
      requestHash
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al administrar producto', {
        actorUid: auth.uid,
        action: request?.action ?? null,
        productId: request?.productId ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
