import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';

const requestInvoiceCall = httpsCallable(
  functionsInstance,
  'requestClientInvoice'
);

// Convierte errores remotos en mensajes comprensibles
const mapInvoiceError = (error) => {
  if (error?.code === 'functions/unauthenticated') {
    return 'Vuelve a iniciar sesión para solicitar la factura';
  }
  if (error?.code === 'functions/failed-precondition') {
    return 'Esta venta todavía no puede facturarse';
  }
  if (error?.code === 'functions/invalid-argument') {
    return 'Revisa los datos fiscales';
  }
  return 'No pudimos guardar la solicitud en este momento';
};

// Envía la solicitud a la función protegida
export const requestClientInvoice = async (payload) => {
  try {
    const response = await requestInvoiceCall(payload);
    return response.data;
  } catch (error) {
    console.error('Error al solicitar la factura', error);
    throw new Error(mapInvoiceError(error), { cause: error });
  }
};
