import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import {
  runReprogramAppointmentTransaction
} from './ReprogramAppointmentTransaction.js';
import {
  validateReprogramRequest
} from './ReprogramAppointmentRequestPolicy.js';

// Convierte errores conocidos al contrato remoto
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
    'No se pudo reprogramar la cita'
  );
};

// Coordina autenticación validación y persistencia
export const reprogramReceptionAppointmentHandler = async ({
  auth,
  data,
  firestore,
  now = new Date()
}) => {
  // Detiene solicitudes sin identidad
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para reprogramar la cita'
    );
  }

  let request;
  try {
    request = validateReprogramRequest(data, now);

    // Devuelve el resultado transaccional
    return await runReprogramAppointmentTransaction({
      actorUid: auth.uid,
      firestore,
      now,
      request
    });
  } catch (error) {
    // Normaliza el error capturado
    const mappedError = mapKnownError(error);

    // Registra únicamente fallos inesperados
    if (mappedError.code === 'internal') {
      logger.error('Fallo inesperado al reprogramar cita', {
        actorUid: auth.uid,
        sourceAppointmentId:
          request?.sourceAppointmentId ?? null,
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
