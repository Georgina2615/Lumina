import { getBlob, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../../config/firebase';
import {
  prepareWebPImage,
  validateImageSource
} from '../../../../shared/services/ImagePreparationService';

const maximumSourceBytes = 8 * 1024 * 1024;
const maximumOutputBytes = 750 * 1024;

// Valida una fotografía local antes de seleccionarla
export const validateClinicalPhotoFile = (file) => (
  validateImageSource({ file, maximumSourceBytes })
    ? null
    : 'Selecciona una fotografía JPG PNG o WebP de hasta ocho megabytes'
);

// Optimiza una fotografía clínica sin recortarla
export const prepareClinicalPhoto = async (file) => {
  const validationError = validateClinicalPhotoFile(file);
  if (validationError) throw new Error(validationError);

  return prepareWebPImage({
    file,
    maximumOutputBytes,
    maximumSourceBytes,
    mode: 'fit',
    outputSize: 1600
  });
};

// Sube una fotografía a su ruta privada determinista
export const uploadClinicalPhoto = async ({
  appointmentId,
  clientId,
  file,
  kind
}) => {
  const blob = await prepareClinicalPhoto(file);
  const imagePath = `sesiones-clinicas/${clientId}/${appointmentId}/${kind}.webp`;

  await uploadBytes(ref(storage, imagePath), blob, {
    cacheControl: 'private,max-age=3600',
    contentType: 'image/webp'
  });

  return imagePath;
};

// Descarga una fotografía privada con la sesión vigente
export const loadPrivateClinicalPhoto = async (imagePath) => {
  if (!imagePath) return null;
  return getBlob(ref(storage, imagePath), maximumOutputBytes);
};
