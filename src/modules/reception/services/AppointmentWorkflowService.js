import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';

// Define las acciones aceptadas por la función segura
export const appointmentAction = Object.freeze({
  confirm: 'confirmar',
  moveToCabin: 'enviar_cabina',
  cancel: 'cancelar',
  markNoShow: 'marcar_no_asistio'
});

// Prepara la frontera remota del flujo operativo
const manageAppointmentCallable = httpsCallable(
  functionsInstance,
  'manageReceptionAppointment'
);

// Define errores de dominio que pueden mostrarse
const domainErrorCodes = new Set([
  'functions/failed-precondition',
  'functions/invalid-argument',
  'functions/not-found'
]);

// Limpia mensajes remotos controlados
const normalizeRemoteMessage = (value) => (
  String(value ?? '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(functions\/[a-z-]+\)\.?\s*$/i, '')
    .trim()
    .slice(0, 300)
);

// Traduce errores remotos a mensajes operativos
const getWorkflowErrorMessage = (error) => {
  // Explica una sesión ausente
  if (error?.code === 'functions/unauthenticated') {
    return 'Inicia sesión para actualizar la cita';
  }

  // Explica permisos insuficientes
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permiso para actualizar citas';
  }

  // Explica fallos temporales de conexión
  if (
    error?.code === 'functions/unavailable'
    || error?.code === 'functions/deadline-exceeded'
  ) {
    return 'No pudimos conectar con la gestión de citas';
  }

  // Conserva errores controlados por el servidor
  if (domainErrorCodes.has(error?.code)) {
    return normalizeRemoteMessage(error?.message)
      || 'La cita cambió y esta acción ya no es válida';
  }

  // Oculta detalles técnicos inesperados
  return 'No pudimos actualizar la cita';
};

// Valida la respuesta mínima del servidor
const mapWorkflowResult = (data) => {
  // Detiene respuestas incompletas
  if (
    typeof data?.appointmentId !== 'string'
    || typeof data?.status !== 'string'
  ) {
    throw new Error('La función devolvió una respuesta incompleta');
  }

  // Devuelve únicamente datos verificados
  return {
    appointmentId: data.appointmentId,
    status: data.status
  };
};

// Ejecuta una transición mediante la función autorizada
export const manageReceptionAppointment = async (request) => {
  try {
    // Envía solo la intención de negocio
    const response = await manageAppointmentCallable(request);

    // Devuelve la transición confirmada
    return mapWorkflowResult(response.data);
  } catch (error) {
    throw new Error(
      getWorkflowErrorMessage(error),
      { cause: error }
    );
  }
};
