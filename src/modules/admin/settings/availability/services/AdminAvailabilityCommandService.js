import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../../../config/firebase';

const manageAvailabilityCallable = httpsCallable(
  functionsInstance,
  'manageScheduleAvailability'
);

// Representa un fallo seguro para la pantalla
export class AdminAvailabilityCommandError extends Error {
  // Conserva el codigo remoto
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = 'AdminAvailabilityCommandError';
    this.code = code;
  }
}

// Traduce fallos remotos a mensajes claros
const getAvailabilityErrorMessage = (error) => {
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no puede cambiar la disponibilidad';
  }

  if (error?.code === 'functions/already-exists') {
    return error?.message || 'El horario dejó de estar disponible';
  }

  if (error?.code === 'functions/failed-precondition') {
    return error?.message || 'El horario no puede modificarse';
  }

  if (error?.code === 'functions/not-found') {
    return 'El horario ya se encuentra disponible';
  }

  if (error?.code === 'functions/invalid-argument') {
    return 'Revisa la fecha el horario y el motivo';
  }

  if (error?.code === 'functions/unauthenticated') {
    return 'Tu sesión terminó. Vuelve a iniciar sesión.';
  }

  return 'No se pudo cambiar la disponibilidad. Inténtalo nuevamente.';
};

// Ejecuta una orden protegida por el servidor
export const manageAdminAvailability = async (payload) => {
  try {
    const response = await manageAvailabilityCallable(payload);
    return response.data;
  } catch (error) {
    throw new AdminAvailabilityCommandError(
      error?.code ?? 'functions/unknown',
      getAvailabilityErrorMessage(error),
      error
    );
  }
};
