import { FieldValue } from 'firebase-admin/firestore';
import { calculateCabinInventoryValue, calculateCabinStock } from './CabinInventoryCalculations.js';
import { buildCabinStockPatch, buildPrivateCabinCostDocument } from './CabinInventoryDocuments.js';
import { readCabinInventoryValue, requireManagedCabinSupply } from './CabinInventoryStoredPolicy.js';
import { buildCabinConsumptionDocument, buildCabinConsumptionMovement } from './CabinConsumptionDocuments.js';
import {
  getExistingCabinConsumption,
  requireCabinConsumptionActor,
  requireCabinConsumptionAppointment,
  requireCabinConsumptionClient,
  requireCabinConsumptionClinicalWork
} from './CabinConsumptionStoredPolicy.js';
import { CabinInventoryError } from './CabinInventoryError.js';

// Registra todos los insumos de una cita de forma atómica
export const runRecordCabinConsumptionTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const appointmentReference = firestore.collection('citas').doc(request.appointmentId);
  const clientReference = firestore.collection('clientes').doc(request.clientId);
  const consentReference = firestore.collection('consentimientosClinicos').doc(request.appointmentId);
  const sessionReference = firestore.collection('sesionesClinicas').doc(request.appointmentId);
  const consumptionReference = firestore.collection('consumosCabina').doc(request.appointmentId);
  const supplyReferences = request.items.map(({ supplyId }) => firestore.collection('insumosCabina').doc(supplyId));
  const costReferences = request.items.map(({ supplyId }) => firestore.collection('costosInsumosCabina').doc(supplyId));

  return firestore.runTransaction(async (transaction) => {
    const snapshots = await transaction.getAll(
      actorReference,
      appointmentReference,
      clientReference,
      consentReference,
      sessionReference,
      consumptionReference,
      ...supplyReferences,
      ...costReferences
    );
    const [actorSnapshot, appointmentSnapshot, clientSnapshot, consentSnapshot, sessionSnapshot, consumptionSnapshot] = snapshots;
    requireCabinConsumptionActor(actorSnapshot);
    const appointment = requireCabinConsumptionAppointment({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      snapshot: appointmentSnapshot
    });
    requireCabinConsumptionClient(clientSnapshot, request.clientId);
    requireCabinConsumptionClinicalWork({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      consentSnapshot,
      sessionSnapshot
    });
    const existing = getExistingCabinConsumption({
      operationId: request.operationId,
      requestHash,
      snapshot: consumptionSnapshot
    });
    if (existing) return existing;

    const timestamp = serverTimestamp();
    const usedItems = request.items.map((item, index) => {
      const supply = requireManagedCabinSupply(snapshots[6 + index], item.expectedRevision);
      if (supply.data.activo !== true) {
        throw new CabinInventoryError('failed-precondition', 'Uno de los insumos ya no está disponible');
      }
      const previousValue = readCabinInventoryValue(snapshots[6 + request.items.length + index], item.supplyId);
      const nextStock = calculateCabinStock({
        previousStockScaled: supply.stockScaled,
        quantityScaled: item.quantityScaled,
        type: 'salida_servicio'
      });
      const nextValue = calculateCabinInventoryValue({
        currentValueCents: previousValue,
        previousStockScaled: supply.stockScaled,
        nextStockScaled: nextStock,
        totalCostCents: null,
        type: 'salida_servicio'
      });
      transaction.update(supplyReferences[index], buildCabinStockPatch({
        actorUid,
        nextStockScaled: nextStock,
        revision: supply.revision + 1,
        supply: supply.data,
        timestamp
      }));
      transaction.set(costReferences[index], buildPrivateCabinCostDocument({
        actorUid,
        inventoryValueCents: nextValue,
        supplyId: item.supplyId,
        timestamp
      }));
      transaction.create(
        firestore.collection('movimientosInsumosCabina').doc(`${request.operationId}_${index}`),
        buildCabinConsumptionMovement({
          actorUid,
          appointmentId: request.appointmentId,
          clientId: request.clientId,
          nextInventoryValueCents: nextValue,
          nextStockScaled: nextStock,
          previousInventoryValueCents: previousValue,
          quantityScaled: item.quantityScaled,
          supply,
          timestamp
        })
      );
      return {
        quantityScaled: item.quantityScaled,
        stockAfterScaled: nextStock,
        supplyId: item.supplyId,
        supplyName: supply.name,
        unit: supply.unit
      };
    });

    const response = { appointmentId: request.appointmentId, itemCount: usedItems.length, status: 'recorded' };
    transaction.create(consumptionReference, buildCabinConsumptionDocument({
      actorUid,
      appointment,
      request,
      requestHash,
      response,
      timestamp,
      usedItems
    }));
    return response;
  });
};
