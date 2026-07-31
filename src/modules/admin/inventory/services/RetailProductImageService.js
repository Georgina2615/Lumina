import { ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../../../config/firebase';
import { attachRetailProductImage } from './RetailInventoryCommandService';

const outputSize = 1200;
const maximumSourceBytes = 8 * 1024 * 1024;
const maximumOutputBytes = 1024 * 1024;
const acceptedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Valida el archivo original antes de crear el producto
export const validateRetailProductImageFile = (file) => (
  acceptedTypes.has(file?.type) && file.size <= maximumSourceBytes
    ? null
    : 'Selecciona una imagen JPG PNG o WebP de hasta ocho megabytes'
);

// Convierte un canvas en una imagen WebP
const canvasToBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
      return;
    }

    reject(new Error('No se pudo procesar la imagen'));
  }, 'image/webp', quality);
});

// Recorta una imagen al centro dentro del formato cuadrado
const drawSquareImage = (context, image) => {
  const sourceSize = Math.min(image.width, image.height);
  const sourceX = (image.width - sourceSize) / 2;
  const sourceY = (image.height - sourceSize) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize
  );
};

// Normaliza una imagen local antes de transferirla
export const prepareRetailProductImage = async (file) => {
  const fileError = validateRetailProductImageFile(file);

  if (fileError) {
    throw new Error(fileError);
  }

  const image = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    image.close();
    throw new Error('No se pudo preparar el área de imagen');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, outputSize, outputSize);
  drawSquareImage(context, image);
  image.close();

  for (const quality of [0.86, 0.72, 0.58, 0.44]) {
    const blob = await canvasToBlob(canvas, quality);

    if (blob.size <= maximumOutputBytes) {
      return blob;
    }
  }

  throw new Error('La imagen no pudo reducirse al tamaño permitido');
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
