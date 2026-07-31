import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import {
  validateManagementRequest
} from './AppointmentManagementPolicy.js';
import {
  runAppointmentManagementTransaction
} from './AppointmentManagementTransaction.js';

// Convierte errores del dominio al contrato remoto
const mapKnownError = (error) => {
  // Conserva errores remotos
  if (error instanceof HttpsError) {
    return error;
  }

  // Convierte errores esperados
  if (error instanceof AppointmentError) {
    return new HttpsError(error.code, error.message);
  }

  // Oculta detalles inesperados
  return new HttpsError(
    'internal',
    'No se pudo actualizar la cita'
  );
};

// Coordina la gestion segura de citas
export const manageReceptionAppointmentHandler = async ({
  auth,
  data,
  firestore,
  now = new Date()
}) => {
  // Detiene solicitudes sin identidad
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para gestionar la cita'
    );
  }

  let request;
  try {
    request = validateManagementRequest(data);

    // Ejecuta la transaccion autorizada
    return await runAppointmentManagementTransaction({
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
      logger.error('Fallo inesperado al gestionar cita', {
        actorUid: auth.uid,
        appointmentId: request?.appointmentId ?? null,
        action: request?.action ?? null,
        errorName: error?.name ?? 'Error',
        errorCode: error?.code ?? null
      });
    }

    // Devuelve el error remoto seguro
    throw mappedError;
  }
};

