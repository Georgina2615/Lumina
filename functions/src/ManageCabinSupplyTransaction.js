import { FieldValue } from 'firebase-admin/firestore';
import {
  calculateCabinInventoryValue,
  calculateCabinStock
} from './CabinInventoryCalculations.js';
import {
  buildCabinManagementMovement,
  buildCabinStockMovement,
  buildCabinStockPatch,
  buildCabinSupplyDocument,
  buildCabinSupplyResponse,
  buildCabinSupplyStatePatch,
  buildCabinSupplyUpdate,
  buildPrivateCabinCostDocument
} from './CabinInventoryDocuments.js';
import {
  mapExistingCabinOperation,
  readCabinInventoryValue,
  requireAvailableCabinSupplyCreation,
  requireCabinInventoryAdmin,
  requireManagedCabinSupply
} from './CabinInventoryStoredPolicy.js';

// Construye la respuesta posterior de una operación
const buildNextResponse = ({
  inventoryValueCents,
  request,
  stockScaled,
  supply
}) => buildCabinSupplyResponse({
  action: request.action,
  active: request.action === 'create'
    ? true
    : request.action === 'set_active'
      ? request.active
      : supply.data.activo,
  inventoryValueCents,
  operationId: request.operationId,
  revision: request.action === 'create' ? 1 : request.expectedRevision + 1,
  stockScaled,
  supplyId: request.supplyId
});

// Ejecuta la administración de un insumo
export const runManageCabinSupplyTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const supplyReference = firestore.collection('insumosCabina').doc(
    request.supplyId
  );
  const costReference = firestore.collection('costosInsumosCabina').doc(
    request.supplyId
  );
  const movementReference = firestore.collection(
    'movimientosInsumosCabina'
  ).doc(request.operationId);
  return firestore.runTransaction(async (transaction) => {
    const [
      actorSnapshot,
      movementSnapshot,
      supplySnapshot,
      costSnapshot
    ] = await transaction.getAll(
      actorReference,
      movementReference,
      supplyReference,
      costReference
    );
    requireCabinInventoryAdmin(actorSnapshot);
    const existing = mapExistingCabinOperation({
      snapshot: movementSnapshot,
      actorUid,
      supplyId: request.supplyId,
      requestHash
    });
    if (existing) {
      return existing;
    }
    const timestamp = serverTimestamp();
    if (request.action === 'create') {
      requireAvailableCabinSupplyCreation({ supplySnapshot, costSnapshot });
      const response = buildNextResponse({
        inventoryValueCents: request.inventoryValueCents,
        request,
        stockScaled: request.initialQuantityScaled,
        supply: null
      });
      transaction.create(supplyReference, buildCabinSupplyDocument({
        actorUid,
        request,
        timestamp
      }));
      transaction.create(costReference, buildPrivateCabinCostDocument({
        actorUid,
        inventoryValueCents: request.inventoryValueCents,
        supplyId: request.supplyId,
        timestamp
      }));
      transaction.create(movementReference, buildCabinManagementMovement({
        actorUid,
        inventoryValueCents: request.inventoryValueCents,
        request,
        requestHash,
        response,
        supplyName: request.name,
        timestamp
      }));
      return response;
    }
    const supply = requireManagedCabinSupply(
      supplySnapshot,
      request.expectedRevision
    );
    const previousInventoryValueCents = readCabinInventoryValue(
      costSnapshot,
      request.supplyId
    );
    if (request.action === 'adjust_stock') {
      const nextStockScaled = calculateCabinStock({
        previousStockScaled: supply.stockScaled,
        quantityScaled: request.quantityScaled,
        type: request.type
      });
      const nextInventoryValueCents = calculateCabinInventoryValue({
        currentValueCents: previousInventoryValueCents,
        previousStockScaled: supply.stockScaled,
        nextStockScaled,
        totalCostCents: request.totalCostCents,
        type: request.type
      });
      const response = buildNextResponse({
        inventoryValueCents: nextInventoryValueCents,
        request,
        stockScaled: nextStockScaled,
        supply
      });
      transaction.update(supplyReference, buildCabinStockPatch({
        actorUid,
        nextStockScaled,
        revision: response.revision,
        supply: supply.data,
        timestamp
      }));
      transaction.set(costReference, buildPrivateCabinCostDocument({
        actorUid,
        inventoryValueCents: nextInventoryValueCents,
        supplyId: request.supplyId,
        timestamp
      }));
      transaction.create(movementReference, buildCabinStockMovement({
        actorUid,
        nextInventoryValueCents,
        nextStockScaled,
        previousInventoryValueCents,
        previousStockScaled: supply.stockScaled,
        request,
        requestHash,
        response,
        supply,
        timestamp
      }));
      return response;
    }
    const response = buildNextResponse({
      inventoryValueCents: previousInventoryValueCents,
      request,
      stockScaled: supply.stockScaled,
      supply
    });
    const update = request.action === 'update'
      ? buildCabinSupplyUpdate({
        actorUid,
        request,
        supply: supply.data,
        timestamp
      })
      : buildCabinSupplyStatePatch({
        actorUid,
        request,
        supply: supply.data,
        timestamp
      });
    transaction.update(supplyReference, update);
    transaction.create(movementReference, buildCabinManagementMovement({
      actorUid,
      inventoryValueCents: previousInventoryValueCents,
      request,
      requestHash,
      response,
      supplyName: request.action === 'update' ? request.name : supply.name,
      timestamp
    }));
    return response;
  });
};
