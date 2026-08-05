import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../../../config/firebase';

const manageCashCloseCallable = httpsCallable(functionsInstance, 'manageCashClose');

// Traduce fallos remotos a mensajes claros
const getCashCloseErrorMessage = (error) => {
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no puede guardar cortes';
  }
  if (error?.code === 'functions/already-exists') {
    return error?.message || 'Ese día ya tiene un corte guardado';
  }
  if (error?.code === 'functions/failed-precondition') {
    return error?.message || 'Actualiza la información antes de continuar';
  }
  if (error?.code === 'functions/not-found') {
    return 'El corte ya no está disponible';
  }
  if (error?.code === 'functions/invalid-argument') {
    return error?.message || 'Revisa los importes del corte';
  }
  if (error?.code === 'functions/unauthenticated') {
    return 'Tu sesión terminó Vuelve a iniciar sesión';
  }

  return 'No se pudo guardar el corte Inténtalo nuevamente';
};

// Guarda una orden validada por el servidor
export const saveAdminCashClose = async (request) => {
  try {
    const response = await manageCashCloseCallable(request);
    return response.data;
  } catch (error) {
    throw new Error(getCashCloseErrorMessage(error), { cause: error });
  }
};
