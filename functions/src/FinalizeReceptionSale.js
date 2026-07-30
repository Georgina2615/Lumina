import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildRequestHash,
  buildSaleIdentifiers
} from './SaleIdentifiers.js';
import { SaleError } from './SaleError.js';
import { validateSaleRequest } from './SalePolicy.js';
import { runSaleTransaction } from './SaleTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  // Conserva errores remotos ya normalizados
  if (error instanceof HttpsError) {
    // Devuelve el error remoto existente
    return error;
  }

  // Convierte errores esperados del dominio
  if (error instanceof SaleError) {
    // Devuelve un error remoto seguro
    return new HttpsError(error.code, error.message);
  }

  // Oculta detalles técnicos inesperados
  return new HttpsError(
    'internal',
    'No se pudo finalizar la venta'
  );
};

// Coordina autenticación validación y persistencia
export const finalizeReceptionSaleHandler = async ({
  auth,
  data,
  firestore
}) => {
  // Detiene solicitudes sin identidad
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para registrar la venta'
    );
  }

  let request;
  try {
    request = validateSaleRequest(data);

    // Construye la identidad financiera
    const { saleId, folio } = buildSaleIdentifiers(request);

    // Resume el contenido protegido de la solicitud
    const requestHash = buildRequestHash(request);

    // Devuelve el resultado transaccional
    return await runSaleTransaction({
      actorUid: auth.uid,
      firestore,
      folio,
      request,
      requestHash,
      saleId
    });
  } catch (error) {
    // Normaliza el error capturado
    const mappedError = mapKnownError(error);

    // Registra únicamente fallos inesperados
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al finalizar venta', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }
    throw mappedError;
  }
};
