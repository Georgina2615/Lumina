import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import {
  validateAppointmentRequest
} from './AppointmentRequestPolicy.js';
import {
  runAppointmentTransaction
} from './AppointmentTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  // Conserva errores remotos ya normalizados
  if (error instanceof HttpsError) {
    // Devuelve el error remoto existente
    return error;
  }

  // Convierte errores esperados del dominio
  if (error instanceof AppointmentError) {
    // Devuelve un error remoto seguro
    return new HttpsError(error.code, error.message);
  }

  // Oculta detalles técnicos inesperados
  return new HttpsError(
    'internal',
    'No se pudo registrar la cita'
  );
};

// Coordina autenticación validación y persistencia
export const createReceptionAppointmentHandler = async ({
  auth,
  data,
  firestore,
  now = new Date()
}) => {
  // Detiene solicitudes sin identidad
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para registrar la cita'
    );
  }

  let request;
  try {
    request = validateAppointmentRequest(data, now);

    // Devuelve el resultado transaccional
    return await runAppointmentTransaction({
      actorUid: auth.uid,
      firestore,
      request
    });
  } catch (error) {
    // Normaliza el error capturado
    const mappedError = mapKnownError(error);

    // Registra únicamente fallos inesperados
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al registrar cita', {
        actorUid: auth.uid,
        serviceId: request?.serviceId ?? null,
        dateKey: request?.dateKey ?? null,
        time: request?.time ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }

    // Devuelve el error remoto seguro
    throw mappedError;
  }
};
