import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';
import {
  buildScheduleAvailabilityChangeDocument,
  buildScheduleAvailabilityResponse,
  buildScheduleBlockDocument
} from './ScheduleAvailabilityDocuments.js';
import {
  buildAppointmentSlotId
} from './AppointmentSchedulePolicy.js';
import {
  isAdministrativeBlock,
  mapExistingAvailabilityOperation,
  requireAffectedScheduleSlots,
  requireAdministrativeBlock,
  requireAvailableScheduleSlot,
  requireScheduleAvailabilityAdmin
} from './ScheduleAvailabilityStoredPolicy.js';

// Construye referencias estables de la operacion
const buildReferences = ({ actorUid, firestore, request }) => ({
  actor: firestore.collection('usuarios').doc(actorUid),
  operation: firestore
    .collection('cambiosDisponibilidad')
    .doc(request.operationId),
  slots: request.intervals.map((interval) => {
    const id = buildAppointmentSlotId(interval);

    return {
      interval,
      id,
      reference: firestore.collection('cupos').doc(id)
    };
  })
});

// Ejecuta el cambio seguro de disponibilidad
export const runManageScheduleAvailabilityTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp,
  toTimestamp = Timestamp.fromDate
}) => {
  const references = buildReferences({ actorUid, firestore, request });

  return firestore.runTransaction(async (transaction) => {
    const snapshots = await transaction.getAll(
      references.actor,
      references.operation,
      ...references.slots.map(({ reference }) => reference)
    );
    const [actorSnapshot, operationSnapshot, ...slotSnapshots] = snapshots;

    requireScheduleAvailabilityAdmin(actorSnapshot);

    const retry = mapExistingAvailabilityOperation({
      actorUid,
      operationSnapshot,
      requestHash
    });

    if (retry) {
      return retry;
    }

    const affectedSlots = [];
    let previousBlock = null;

    if (request.action === 'reopen_slot') {
      previousBlock = requireAdministrativeBlock(slotSnapshots[0]);
      affectedSlots.push(references.slots[0]);
    } else if (request.action === 'block_slot') {
      requireAvailableScheduleSlot(slotSnapshots[0]);
      affectedSlots.push(references.slots[0]);
    } else {
      slotSnapshots.forEach((snapshot, index) => {
        if (!snapshot.exists) {
          affectedSlots.push(references.slots[index]);
          return;
        }

        // Conserva citas y bloqueos existentes
        if (!isAdministrativeBlock(snapshot)) {
          return;
        }
      });

      requireAffectedScheduleSlots(affectedSlots);
    }

    const timestamp = serverTimestamp();
    const affectedSlotIds = affectedSlots.map(({ id }) => id);
    const response = buildScheduleAvailabilityResponse({
      affectedSlotIds,
      operationId: request.operationId
    });

    if (request.action === 'reopen_slot') {
      transaction.delete(affectedSlots[0].reference);
    } else {
      affectedSlots.forEach(({ interval, reference }) => {
        transaction.create(reference, buildScheduleBlockDocument({
          actorUid,
          interval,
          reason: request.reason,
          timestamp,
          toTimestamp
        }));
      });
    }

    transaction.create(
      references.operation,
      buildScheduleAvailabilityChangeDocument({
        actorUid,
        affectedSlotIds,
        previousBlock,
        request,
        requestHash,
        response,
        timestamp
      })
    );

    return response;
  });
};
