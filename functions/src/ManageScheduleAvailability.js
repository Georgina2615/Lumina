import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildScheduleAvailabilityRequestHash,
  ScheduleAvailabilityError,
  validateScheduleAvailabilityRequest
} from './ScheduleAvailabilityPolicy.js';
import {
  runManageScheduleAvailabilityTransaction
} from './ManageScheduleAvailabilityTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) {
    return error;
  }

  if (error instanceof ScheduleAvailabilityError) {
    return new HttpsError(error.code, error.message);
  }

  return new HttpsError(
    'internal',
    'No se pudo cambiar la disponibilidad'
  );
};

// Coordina autenticacion validacion y persistencia
export const manageScheduleAvailabilityHandler = async ({
  auth,
  data,
  firestore,
  now = new Date()
}) => {
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para cambiar la disponibilidad'
    );
  }

  let request;

  try {
    request = validateScheduleAvailabilityRequest(data, now);

    return await runManageScheduleAvailabilityTransaction({
      actorUid: auth.uid,
      firestore,
      request,
      requestHash: buildScheduleAvailabilityRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);

    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al cambiar disponibilidad', {
        actorUid: auth.uid,
        action: request?.action ?? null,
        dateKey: request?.dateKey ?? null,
        time: request?.time ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }

    throw mappedError;
  }
};
