import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../../config/firebase';

const manageClinicalSessionCallable = httpsCallable(
  functionsInstance,
  'manageClinicalSession'
);

const knownMessages = [
  'La cita debe estar en cabina',
  'Crea la ficha técnica',
  'Completa la ficha técnica',
  'El seguimiento cambió',
  'Registra la autorización',
  'fotografía'
];

// Convierte errores remotos en mensajes claros
const getClinicalSessionErrorMessage = (error) => {
  const message = typeof error?.message === 'string' ? error.message : '';
  const knownMessage = knownMessages.find((candidate) => message.includes(candidate));

  if (knownMessage) {
    return message.replace(/^FirebaseError:\s*/i, '');
  }
  if (error?.code === 'functions/unauthenticated') {
    return 'Tu sesión terminó vuelve a iniciar sesión';
  }
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no puede guardar seguimientos';
  }

  return 'No pudimos guardar el seguimiento';
};

// Crea un identificador único para reintentos seguros
export const createClinicalSessionOperationId = () => (
  globalThis.crypto?.randomUUID?.()
  ?? `clinical-session-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

// Guarda el seguimiento mediante la función protegida
export const saveClinicalSession = async (payload) => {
  try {
    const response = await manageClinicalSessionCallable(payload);
    return response.data;
  } catch (error) {
    throw new Error(getClinicalSessionErrorMessage(error), { cause: error });
  }
};
