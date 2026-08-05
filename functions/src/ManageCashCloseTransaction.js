import { FieldValue } from 'firebase-admin/firestore';
import {
  buildCashCloseChangeDocument,
  buildCashCloseDocument,
  buildCashCloseResponse,
  buildCashCloseValues
} from './CashCloseDocuments.js';
import { failCashClose } from './CashClosePolicy.js';

// Exige una administradora activa
const requireAdmin = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'admin') {
    failCashClose('permission-denied', 'Tu cuenta no puede guardar cortes');
  }
};

// Reconoce un reintento exacto
const mapExistingOperation = ({ actorUid, operationSnapshot, requestHash }) => {
  if (!operationSnapshot.exists) return null;
  const operation = operationSnapshot.data();

  if (
    operation.actorUid !== actorUid
    || operation.idempotencia?.hashSolicitud !== requestHash
    || !operation.resultado
  ) {
    failCashClose('already-exists', 'La operación ya fue utilizada');
  }

  return { ...operation.resultado, alreadyProcessed: true };
};

// Ejecuta el guardado seguro del corte
export const runManageCashCloseTransaction = async ({
  actorUid,
  firestore,
  paymentSummary,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const closeReference = firestore.collection('cortesCaja').doc(request.dateKey);
  const operationReference = firestore
    .collection('cambiosCortesCaja')
    .doc(request.operationId);

  return firestore.runTransaction(async (transaction) => {
    const [actorSnapshot, operationSnapshot, closeSnapshot] = await transaction
      .getAll(actorReference, operationReference, closeReference);
    requireAdmin(actorSnapshot);

    const retry = mapExistingOperation({
      actorUid,
      operationSnapshot,
      requestHash
    });
    if (retry) return retry;

    if (request.action === 'close' && closeSnapshot.exists) {
      failCashClose('already-exists', 'Ese día ya tiene un corte guardado');
    }
    if (request.action === 'correct' && !closeSnapshot.exists) {
      failCashClose('not-found', 'El corte ya no está disponible');
    }

    const previous = closeSnapshot.exists ? closeSnapshot.data() : null;
    if (
      request.action === 'correct'
      && previous.revision !== request.expectedRevision
    ) {
      failCashClose('failed-precondition', 'El corte cambió Actualiza la pantalla');
    }

    const values = buildCashCloseValues({ paymentSummary, request });
    const revision = (previous?.revision ?? 0) + 1;
    const timestamp = serverTimestamp();
    const response = buildCashCloseResponse({
      dateKey: request.dateKey,
      revision,
      values
    });

    if (request.action === 'close') {
      transaction.create(closeReference, buildCashCloseDocument({
        actorUid,
        dateKey: request.dateKey,
        revision,
        timestamp,
        values
      }));
    } else {
      transaction.update(closeReference, {
        ...values,
        revision,
        actualizadoEn: timestamp,
        actualizadoPor: actorUid
      });
    }

    transaction.create(operationReference, buildCashCloseChangeDocument({
      actorUid,
      previousValues: previous,
      request,
      requestHash,
      response,
      timestamp
    }));

    return response;
  });
};
