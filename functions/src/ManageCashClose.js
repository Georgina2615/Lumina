import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildCashCloseRequestHash,
  CashCloseError,
  validateCashCloseRequest
} from './CashClosePolicy.js';
import { loadCashClosePayments } from './CashClosePaymentService.js';
import { runManageCashCloseTransaction } from './ManageCashCloseTransaction.js';

// Traduce errores conocidos para la pantalla
const mapKnownError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error instanceof CashCloseError) {
    return new HttpsError(error.code, error.message);
  }
  if (error?.message === 'Los retiros superan el efectivo disponible') {
    return new HttpsError('invalid-argument', error.message);
  }
  return new HttpsError('internal', 'No se pudo guardar el corte');
};

// Coordina el calculo y guardado del corte
export const manageCashCloseHandler = async ({
  auth,
  data,
  firestore,
  now = new Date()
}) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para guardar el corte');
  }

  let request;
  try {
    request = validateCashCloseRequest(data, now);
    const paymentSummary = await loadCashClosePayments({
      firestore,
      dateKey: request.dateKey
    });

    return await runManageCashCloseTransaction({
      actorUid: auth.uid,
      firestore,
      paymentSummary,
      request,
      requestHash: buildCashCloseRequestHash(request)
    });
  } catch (error) {
    const mappedError = mapKnownError(error);
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al guardar el corte', {
        actorUid: auth.uid,
        dateKey: request?.dateKey ?? null,
        errorName: error?.name ?? 'Error'
      });
    }
    throw mappedError;
  }
};
