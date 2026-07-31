import { FieldValue } from 'firebase-admin/firestore';
import { RetailInventoryError } from './RetailInventoryError.js';
import {
  calculateWeightedAverageCost
} from './RetailInventoryCalculations.js';
import {
  buildPrivateProductCostDocument,
  buildRetailStockMovement,
  buildRetailStockPatch
} from './RetailInventoryDocuments.js';
import {
  mapExistingRetailOperation,
  readPrivateProductCost,
  requireManagedRetailProduct,
  requireRetailAdmin
} from './RetailInventoryStoredPolicy.js';

// Reconoce movimientos que aumentan existencias
const POSITIVE_TYPES = new Set([
  'entrada_reabastecimiento',
  'ajuste_positivo'
]);

// Calcula las existencias posteriores
const calculateCurrentStock = (request, previousStock) => {
  const direction = POSITIVE_TYPES.has(request.type) ? 1 : -1;
  const currentStock = previousStock + direction * request.quantity;
  if (!Number.isSafeInteger(currentStock) || currentStock < 0) {
    throw new RetailInventoryError(
      'failed-precondition',
      'El movimiento dejaría existencias negativas'
    );
  }
  return currentStock;
};

// Construye la respuesta pública del ajuste
const buildStockResponse = ({
  averageCostCents,
  currentStock,
  previousStock,
  request
}) => ({
  productId: request.productId,
  operationId: request.operationId,
  revision: request.expectedRevision + 1,
  previousStock,
  currentStock,
  averageCostCents,
  alreadyProcessed: false
});

// Ejecuta un movimiento manual de existencias
export const runAdjustRetailStockTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const productReference = firestore.collection('productos').doc(
    request.productId
  );
  const costReference = firestore.collection('costosProductos').doc(
    request.productId
  );
  const movementReference = firestore.collection('movimientosInventario').doc(
    request.operationId
  );
  return firestore.runTransaction(async (transaction) => {
    const [
      actorSnapshot,
      movementSnapshot,
      productSnapshot,
      costSnapshot
    ] = await transaction.getAll(
      actorReference,
      movementReference,
      productReference,
      costReference
    );
    requireRetailAdmin(actorSnapshot);
    const existing = mapExistingRetailOperation({
      snapshot: movementSnapshot,
      actorUid,
      productId: request.productId,
      requestHash
    });
    if (existing) {
      return existing;
    }
    const product = requireManagedRetailProduct(
      productSnapshot,
      request.expectedRevision
    );
    const previousCost = readPrivateProductCost(
      costSnapshot,
      request.productId
    );
    const currentStock = calculateCurrentStock(request, product.stock);
    const averageCostCents = POSITIVE_TYPES.has(request.type)
      ? calculateWeightedAverageCost({
        currentCostCents: previousCost,
        currentStock: product.stock,
        incomingCostCents: request.unitCostCents,
        incomingQuantity: request.quantity
      })
      : previousCost;
    const movementCostCents = POSITIVE_TYPES.has(request.type)
      ? request.unitCostCents ?? previousCost
      : previousCost;
    const response = buildStockResponse({
      averageCostCents,
      currentStock,
      previousStock: product.stock,
      request
    });
    const timestamp = serverTimestamp();
    transaction.update(productReference, buildRetailStockPatch({
      actorUid,
      currentStock,
      product: product.data,
      revision: response.revision,
      timestamp
    }));
    if (averageCostCents !== null) {
      transaction.set(costReference, buildPrivateProductCostDocument({
        actorUid,
        averageCostCents,
        productId: request.productId,
        timestamp
      }));
    }
    transaction.create(movementReference, buildRetailStockMovement({
      actorUid,
      averageCostCents,
      currentStock,
      movementCostCents,
      previousStock: product.stock,
      productName: product.name,
      request,
      requestHash,
      response,
      timestamp
    }));
    return response;
  });
};
