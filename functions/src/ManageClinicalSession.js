import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { ClinicalSessionError } from './ClinicalSessionFieldPolicy.js';
import { requireStoredClinicalPhotos } from './ClinicalSessionImagePolicy.js';
import {
  buildClinicalSessionRequestHash,
  validateClinicalSessionRequest
} from './ClinicalSessionPolicy.js';
import {
  findPreviousClinicalSession,
  requireClinicalSessionActor
} from './ClinicalSessionStoredPolicy.js';
import {
  runManageClinicalSessionTransaction
} from './ManageClinicalSessionTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof ClinicalSessionError) {
    return new HttpsError(error.code, error.message);
  }
  return new HttpsError('internal', 'No se pudo guardar el seguimiento');
};

// Coordina identidad fotografías e historial clínico
export const manageClinicalSessionHandler = async ({
  auth,
  data,
  firestore,
  storage
}) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para guardar el seguimiento');
  }

  let request;

  try {
    request = validateClinicalSessionRequest(data);
    const actorSnapshot = await firestore.collection('usuarios').doc(auth.uid).get();
    requireClinicalSessionActor(actorSnapshot);
    const previousSnapshot = await firestore.collection('sesionesClinicas')
      .where('clientId', '==', request.clientId)
      .get();
    const previousSession = findPreviousClinicalSession({
      appointmentId: request.appointmentId,
      documents: previousSnapshot.docs
    });
    const photos = await requireStoredClinicalPhotos({
      photos: request.session.photos,
      storage
    });
    const normalizedRequest = {
      ...request,
      session: { ...request.session, photos }
    };
    const requestHash = buildClinicalSessionRequestHash(normalizedRequest);

    return await runManageClinicalSessionTransaction({
      actorUid: auth.uid,
      firestore,
      previousSession,
      request: normalizedRequest,
      requestHash
    });
  } catch (error) {
    const mappedError = mapKnownError(error);

    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al guardar seguimiento clínico', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        clientId: request?.clientId ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }

    throw mappedError;
  }
};
