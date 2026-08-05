import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../../config/firebase';
import {
  prepareWebPImage,
  validateImageSource
} from '../../../../shared/services/ImagePreparationService';
import { attachRetailProductImage } from './RetailInventoryCommandService';

const outputSize = 1200;
const maximumSourceBytes = 8 * 1024 * 1024;
const maximumOutputBytes = 1024 * 1024;

// Valida el archivo original antes de crear el producto
export const validateRetailProductImageFile = (file) => (
  validateImageSource({ file, maximumSourceBytes })
    ? null
    : 'Selecciona una imagen JPG PNG o WebP de hasta ocho megabytes'
);

// Normaliza una imagen local antes de transferirla
export const prepareRetailProductImage = async (file) => {
  const fileError = validateRetailProductImageFile(file);

  if (fileError) {
    throw new Error(fileError);
  }

  return prepareWebPImage({
    file,
    maximumOutputBytes,
    maximumSourceBytes,
    mode: 'square',
    outputSize
  });
};

// Sube y vincula la imagen determinista del producto
export const uploadRetailProductImage = async ({
  expectedRevision,
  file,
  operationId,
  productId
}) => {
  const blob = await prepareRetailProductImage(file);
  const imagePath = `productos/${productId}/catalogo.webp`;
  const imageReference = ref(storage, imagePath);
  await uploadBytes(imageReference, blob, {
    cacheControl: 'public,max-age=31536000',
    contentType: 'image/webp'
  });

  return attachRetailProductImage({
    expectedRevision,
    imagePath,
    operationId,
    productId
  });
};
