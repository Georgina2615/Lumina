import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';

// Prepara la frontera de la función remota
const finalizeReceptionSaleCallable = httpsCallable(
  functionsInstance,
  'finalizeReceptionSale'
);

// Normaliza errores remotos para la interfaz
const getSaleErrorMessage = (error) => {
  // Explica una función ausente
  if (error?.code === 'functions/not-found') {
    // Devuelve el mensaje local
    return 'La función de cobro no está disponible en este entorno';
  }
  // Explica una conexión ausente
  if (error?.code === 'functions/unavailable') {
    // Devuelve el mensaje de conexión
    return 'No hay conexión con la función de cobro';
  }
  // Explica una sesión ausente
  if (error?.code === 'functions/unauthenticated') {
    // Devuelve el mensaje de sesión
    return 'Inicia sesión para registrar la venta';
  }
  // Obtiene el mensaje remoto seguro
  const remoteMessage = error?.details?.message || error?.message;
  // Conserva mensajes conocidos
  if (typeof remoteMessage === 'string' && remoteMessage.trim()) {
    // Devuelve el mensaje normalizado
    return remoteMessage.replace(/^Firebase:\s*/i, '').trim();
  }
  // Devuelve un mensaje estable
  return 'No se pudo registrar el cobro';
};

// Ejecuta el cierre seguro mediante la función autorizada
export const finalizeReceptionSale = async (request) => {
  try {
    // Ejecuta la función remota
    const response = await finalizeReceptionSaleCallable(request);
    // Lee la respuesta validada
    const result = response.data;
    // Rechaza respuestas incompletas
    if (
      !result
      || typeof result.saleId !== 'string'
      || typeof result.folio !== 'string'
    ) {
      throw new Error('La función devolvió una respuesta incompleta');
    }
    // Devuelve la venta confirmada
    return result;
  } catch (error) {
    throw new Error(getSaleErrorMessage(error), { cause: error });
  }
};
