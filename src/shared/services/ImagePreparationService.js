const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Valida una imagen local antes de procesarla
export const validateImageSource = ({ file, maximumSourceBytes }) => (
  acceptedImageTypes.has(file?.type) && file.size <= maximumSourceBytes
);

// Convierte un canvas en una imagen WebP
const canvasToWebP = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
      return;
    }
    reject(new Error('No se pudo procesar la imagen'));
  }, 'image/webp', quality);
});

// Calcula el recorte cuadrado o el ajuste proporcional
const getDrawingArea = ({ image, mode, outputSize }) => {
  if (mode === 'square') {
    const sourceSize = Math.min(image.width, image.height);
    return {
      canvasHeight: outputSize,
      canvasWidth: outputSize,
      sourceHeight: sourceSize,
      sourceWidth: sourceSize,
      sourceX: (image.width - sourceSize) / 2,
      sourceY: (image.height - sourceSize) / 2
    };
  }

  const scale = Math.min(1, outputSize / Math.max(image.width, image.height));
  return {
    canvasHeight: Math.max(1, Math.round(image.height * scale)),
    canvasWidth: Math.max(1, Math.round(image.width * scale)),
    sourceHeight: image.height,
    sourceWidth: image.width,
    sourceX: 0,
    sourceY: 0
  };
};

// Prepara una imagen con límites configurables
export const prepareWebPImage = async ({
  file,
  maximumOutputBytes,
  maximumSourceBytes,
  mode = 'fit',
  outputSize
}) => {
  if (!validateImageSource({ file, maximumSourceBytes })) {
    throw new Error('Selecciona una imagen JPG PNG o WebP válida');
  }

  const image = await createImageBitmap(file);
  const area = getDrawingArea({ image, mode, outputSize });
  const canvas = document.createElement('canvas');
  canvas.width = area.canvasWidth;
  canvas.height = area.canvasHeight;
  const context = canvas.getContext('2d', { alpha: false });

  if (!context) {
    image.close();
    throw new Error('No se pudo preparar el área de imagen');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(
    image,
    area.sourceX,
    area.sourceY,
    area.sourceWidth,
    area.sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
  image.close();

  for (const quality of [0.86, 0.72, 0.58, 0.44]) {
    const blob = await canvasToWebP(canvas, quality);
    if (blob.size <= maximumOutputBytes) return blob;
  }

  throw new Error('La imagen no pudo reducirse al tamaño permitido');
};
