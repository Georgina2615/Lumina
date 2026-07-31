import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';

// Prepara la reserva protegida en el servidor
const createAppointmentCallable = httpsCallable(
  functionsInstance,
  'createReceptionAppointment'
);

// Define errores remotos seguros para el usuario
const domainErrorCodes = new Set([
  'functions/already-exists',
  'functions/failed-precondition',
  'functions/invalid-argument',
  'functions/not-found'
]);

// Limpia un mensaje remoto controlado
const normalizeRemoteMessage = (value) => (
  String(value ?? '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(functions\/[a-z-]+\)\.?\s*$/i, '')
    .trim()
    .slice(0, 300)
);

// Traduce errores de infraestructura y dominio
const getBookingErrorMessage = (error) => {
  // Explica una sesión ausente
  if (error?.code === 'functions/unauthenticated') {
    return 'Inicia sesión para registrar la cita';
  }

  // Explica permisos insuficientes
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permiso para registrar citas';
  }

  // Explica un recurso ausente o una función todavía no publicada
  if (error?.code === 'functions/not-found') {
    const remoteMessage = normalizeRemoteMessage(error?.message);

    // Conserva la ausencia esperada de un dato real
    if (
      remoteMessage
      && !/^not found$/i.test(remoteMessage)
    ) {
      return remoteMessage;
    }

    // Explica la ausencia del punto de entrada remoto
    return 'El registro seguro de citas todavía no está disponible';
  }

  // Explica fallos temporales de conexión
  if (
    error?.code === 'functions/unavailable'
    || error?.code === 'functions/deadline-exceeded'
  ) {
    return 'No pudimos conectar con el registro de citas';
  }

  // Conserva mensajes esperados del dominio
  if (domainErrorCodes.has(error?.code)) {
    return normalizeRemoteMessage(error?.message)
      || 'Revisa los datos de la cita';
  }

  // Oculta detalles técnicos inesperados
  return 'No pudimos registrar la cita';
};

// Valida la respuesta mínima del servidor
const mapBookingResult = (data) => {
  // Detiene respuestas incompletas
  if (
    typeof data?.appointmentId !== 'string'
    || typeof data?.clientId !== 'string'
    || typeof data?.slotId !== 'string'
  ) {
    throw new Error('La función devolvió una reserva incompleta');
  }

  // Devuelve únicamente identidades verificadas
  return {
    appointmentId: data.appointmentId,
    clientId: data.clientId,
    slotId: data.slotId
  };
};

// Solicita la creación atómica de una cita
export const createAppointmentBooking = async ({
  client,
  contactChannel,
  serviceId,
  dateKey,
  time,
  deposit
}) => {
  try {
    // Envía solo la intención de negocio
    const response = await createAppointmentCallable({
      client,
      contactChannel,
      serviceId,
      dateKey,
      time,
      deposit
    });

    // Devuelve la reserva registrada
    return mapBookingResult(response.data);
  } catch (error) {
    throw new Error(
      getBookingErrorMessage(error),
      { cause: error }
    );
  }
};
