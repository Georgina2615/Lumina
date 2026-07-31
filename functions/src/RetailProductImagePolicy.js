import { getDownloadURL } from 'firebase-admin/storage';
import { RetailInventoryError } from './RetailInventoryError.js';

// Define el tamaño máximo de una imagen normalizada
const MAX_IMAGE_BYTES = 1024 * 1024;

// Verifica una imagen ya cargada en Storage
export const requireStoredRetailImage = async ({
  downloadUrlResolver = getDownloadURL,
  imagePath,
  storage
}) => {
  const file = storage.bucket().file(imagePath);
  let metadata;
  try {
    [metadata] = await file.getMetadata();
  } catch (error) {
    if (error?.code === 404 || error?.code === 'storage/object-not-found') {
      throw new RetailInventoryError('not-found', 'La imagen todavía no existe');
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
    throw new RetailInventoryError(
      'failed-precondition',
      'La imagen debe ser WebP y pesar como máximo un megabyte'
    );
  }
  return {
    path: imagePath,
    url: await downloadUrlResolver(file)
  };
};
