import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';

const getClientAccountCall = httpsCallable(
  functionsInstance,
  'getClientAccount'
);

// Convierte errores remotos en mensajes claros
const mapClientAccountError = (error) => {
  if (error?.code === 'functions/not-found') {
    return 'No encontramos una clienta registrada con este correo';
  }
  if (error?.code === 'functions/unauthenticated') {
    return 'Inicia sesión con un correo verificado';
  }
  if (error?.code === 'functions/permission-denied') {
    return 'Esta cuenta no puede consultar estas citas';
  }
  return 'No pudimos consultar tus citas en este momento';
};

// Consulta el perfil limitado de la clienta
export const loadClientAccount = async () => {
  try {
    const response = await getClientAccountCall();
    return {
      client: response.data?.client ?? null,
      appointments: Array.isArray(response.data?.appointments)
        ? response.data.appointments
        : []
    };
  } catch (error) {
    console.error('Error al consultar la cuenta de la clienta', error);
    throw new Error(mapClientAccountError(error), { cause: error });
  }
};
