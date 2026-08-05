import { collection, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../config/firebase';

const manageClinicalRecordCallable = httpsCallable(
  functionsInstance,
  'manageClinicalRecord'
);

// Limpia mensajes controlados del servidor
const normalizeRemoteMessage = (value) => (
  String(value ?? '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(functions\/[a-z-]+\)\.?\s*$/i, '')
    .trim()
    .slice(0, 300)
);

// Traduce errores remotos a mensajes claros
const getClinicalRecordErrorMessage = (error) => {
  if (error?.code === 'functions/unauthenticated') {
    return 'Tu sesión terminó. Vuelve a iniciar sesión.';
  }

  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permiso para guardar fichas clínicas';
  }

  if (error?.code === 'functions/not-found') {
    return 'La clienta ya no está disponible';
  }

  if (error?.code === 'functions/failed-precondition') {
    return normalizeRemoteMessage(error.message)
      || 'La ficha o la cita cambió y debe volver a cargarse';
  }

  if (error?.code === 'functions/invalid-argument') {
    return 'Revisa las respuestas de la ficha antes de guardar';
  }

  return 'No pudimos guardar la ficha. Inténtalo nuevamente.';
};

// Reserva una identidad sin escribir datos
export const createClinicalOperationId = () => (
  doc(collection(db, 'expedientesClinicos')).id
);

// Guarda una ficha mediante la función protegida
export const saveClinicalRecord = async (payload) => {
  try {
    const response = await manageClinicalRecordCallable(payload);
    return response.data;
  } catch (error) {
    throw new Error(getClinicalRecordErrorMessage(error), { cause: error });
  }
};
