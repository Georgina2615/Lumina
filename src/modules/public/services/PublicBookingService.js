import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../config/firebase';
import { prepareWebPImage } from '../../../shared/services/ImagePreparationService';

// Conecta las operaciones publicas protegidas
const getAvailabilityCall = httpsCallable(functionsInstance, 'getPublicAvailability');
const submitRequestCall = httpsCallable(functionsInstance, 'submitPublicAppointmentRequest');

// Convierte un archivo procesado en texto transportable
const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('No se pudo leer el comprobante'));
  reader.readAsDataURL(blob);
});

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

// Obtiene los datos publicos para transferencias
export const loadPublicPaymentConfig = async () => {
  const snapshot = await getDoc(doc(db, 'configuracionPublica', 'pagos'));
  const data = snapshot.exists() ? snapshot.data() : null;
  if (
    data?.active !== true
    || typeof data.bankName !== 'string'
    || typeof data.beneficiaryName !== 'string'
    || !/^\d{18}$/.test(String(data.clabe ?? ''))
  ) {
    throw new Error('Los datos de transferencia aún no están disponibles');
  }
  return {
    bankName: data.bankName.trim(),
    beneficiaryName: data.beneficiaryName.trim(),
    clabe: String(data.clabe)
  };
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

// Prepara el comprobante antes del envio
export const preparePublicPaymentProof = async (file) => {
  const blob = await prepareWebPImage({
    file,
    maximumOutputBytes: 750 * 1024,
    maximumSourceBytes: 8 * 1024 * 1024,
    outputSize: 1600
  });
  return blobToDataUrl(blob);
};

// Envia una solicitud completa al servidor
export const submitPublicBooking = async (payload) => {
  try {
    const response = await submitRequestCall(payload);
    return response.data;
  } catch (error) {
    console.error('Error al enviar solicitud pública', error);
    throw new Error(mapBookingError(error), { cause: error });
  }
};
