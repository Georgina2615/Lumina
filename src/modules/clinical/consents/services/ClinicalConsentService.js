import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes } from 'firebase/storage';
import { functionsInstance, storage } from '../../../../config/firebase';

const manageClinicalConsentCallable = httpsCallable(
  functionsInstance,
  'manageClinicalConsent'
);

// Obtiene el mensaje comprensible del servidor
const getConsentErrorMessage = (error) => {
  const message = error?.message?.replace(/^FirebaseError:\s*/i, '').trim();
  if (message && !message.includes('INTERNAL')) return message;
  return 'No pudimos gestionar el consentimiento';
};

// Carga el consentimiento y su plantilla real
export const loadClinicalConsent = async ({ appointmentId, clientId }) => {
  try {
    const response = await manageClinicalConsentCallable({
      action: 'load',
      appointmentId,
      clientId
    });
    return response.data;
  } catch (error) {
    throw new Error(getConsentErrorMessage(error), { cause: error });
  }
};

// Convierte el lienzo en una imagen privada
const canvasToWebp = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (!blob) reject(new Error('No pudimos preparar la firma'));
    else resolve(blob);
  }, 'image/webp', 0.9);
});

// Sube la firma a su ruta privada y estable
export const uploadClinicalConsentSignature = async ({
  appointmentId,
  canvas,
  clientId
}) => {
  const signaturePath = `consentimientos-clinicos/${clientId}/${appointmentId}/firma.webp`;
  const blob = await canvasToWebp(canvas);
  if (blob.size > 250 * 1024) throw new Error('La firma supera el tamaño permitido');
  await uploadBytes(ref(storage, signaturePath), blob, {
    contentType: 'image/webp'
  });
  return signaturePath;
};

// Firma el consentimiento mediante la función protegida
export const signClinicalConsent = async (payload) => {
  try {
    const response = await manageClinicalConsentCallable({
      action: 'sign',
      ...payload
    });
    return response.data;
  } catch (error) {
    throw new Error(getConsentErrorMessage(error), { cause: error });
  }
};

// Crea una identidad única para cada intento
export const createClinicalConsentOperationId = () => (
  globalThis.crypto?.randomUUID?.() ?? `consent-${Date.now()}`
);
