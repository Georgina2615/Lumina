import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';

// Conecta las operaciones publicas protegidas
const getAvailabilityCall = httpsCallable(functionsInstance, 'getPublicAvailability');
const createPaymentCall = httpsCallable(functionsInstance, 'createPublicPaymentPreference');
const confirmPaymentCall = httpsCallable(functionsInstance, 'confirmPublicPayment');

// Convierte errores remotos en mensajes claros
const mapBookingError = (error) => {
  if (error?.code === 'functions/already-exists') {
    return error.message || 'El horario ya no está disponible';
  }
  if (error?.code === 'functions/invalid-argument') {
    return error.message || 'Revisa la información capturada';
  }
  if (error?.code === 'functions/resource-exhausted') {
    return 'Espera un momento antes de enviar otra solicitud';
  }
  return 'No pudimos completar la solicitud en este momento';
};

// Consulta los horarios seguros de una fecha
export const loadPublicAvailability = async (dateKey) => {
  try {
    const response = await getAvailabilityCall({ dateKey });
    return Array.isArray(response.data?.times) ? response.data.times : [];
  } catch (error) {
    console.error('Error al consultar disponibilidad pública', error);
    throw new Error('No pudimos consultar los horarios de esta fecha', {
      cause: error
    });
  }
};

// Crea el enlace protegido para pagar
export const createPublicBookingPayment = async (payload) => {
  try {
    const response = await createPaymentCall(payload);
    return response.data;
  } catch (error) {
    console.error('Error al preparar pago público', error);
    throw new Error(mapBookingError(error), { cause: error });
  }
};

// Confirma el pago al regresar desde Mercado Pago
export const confirmPublicBookingPayment = async (payload) => {
  try {
    const response = await confirmPaymentCall(payload);
    return response.data;
  } catch (error) {
    console.error('Error al confirmar pago público', error);
    throw new Error(mapBookingError(error), { cause: error });
  }
};
