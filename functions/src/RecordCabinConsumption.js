import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { CabinInventoryError } from './CabinInventoryError.js';
import {
  buildCabinConsumptionRequestHash,
  validateCabinConsumptionRequest
} from './CabinConsumptionPolicy.js';
import { runRecordCabinConsumptionTransaction } from './RecordCabinConsumptionTransaction.js';

// Convierte errores conocidos al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof CabinInventoryError) return new HttpsError(error.code, error.message);
  return new HttpsError('internal', 'No pudimos registrar los insumos utilizados');
};

// Coordina identidad validación y descuento de inventario
export const recordCabinConsumptionHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para registrar insumos');
  }
  let request;
  try {
    request = validateCabinConsumptionRequest(data);
    return await runRecordCabinConsumptionTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildCabinConsumptionRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al registrar consumo de cabina', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
