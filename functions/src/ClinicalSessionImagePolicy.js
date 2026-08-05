import { failClinicalSession } from './ClinicalSessionFieldPolicy.js';

const MAX_IMAGE_BYTES = 750 * 1024;

// Verifica una fotografía privada ya almacenada
const requireStoredClinicalPhoto = async ({ imagePath, storage }) => {
  if (!imagePath) return '';

  const file = storage.bucket().file(imagePath);
  let metadata;

  try {
    [metadata] = await file.getMetadata();
  } catch (error) {
    if (error?.code === 404 || error?.code === 'storage/object-not-found') {
      failClinicalSession('not-found', 'Una fotografía todavía no terminó de subir');
    }
    throw error;
  }

  const size = Number(metadata.size);

  if (
    metadata.contentType !== 'image/webp'
    || !Number.isSafeInteger(size)
    || size <= 0
    || size > MAX_IMAGE_BYTES
  ) {
    failClinicalSession('failed-precondition', 'La fotografía no cumple el formato privado requerido');
  }

  return imagePath;
};

// Verifica todas las fotografías declaradas
export const requireStoredClinicalPhotos = async ({ photos, storage }) => {
  const [afterPath, beforePath] = await Promise.all([
    requireStoredClinicalPhoto({ imagePath: photos.afterPath, storage }),
    requireStoredClinicalPhoto({ imagePath: photos.beforePath, storage })
  ]);

  return { afterPath, beforePath };
};
