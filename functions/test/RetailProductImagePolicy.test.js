import assert from 'node:assert/strict';
import test from 'node:test';
import { RetailInventoryError } from '../src/RetailInventoryError.js';
import {
  requireStoredRetailImage
} from '../src/RetailProductImagePolicy.js';

// Construye un adaptador de Storage en memoria
const buildStorage = (metadata) => {
  const file = {
    getMetadata: async () => [metadata]
  };
  return {
    file,
    storage: {
      bucket: () => ({ file: () => file })
    }
  };
};

test('acepta una imagen WebP normalizada de hasta un megabyte', async () => {
  const { file, storage } = buildStorage({
    contentType: 'image/webp',
    size: String(1024 * 1024)
  });
  const result = await requireStoredRetailImage({
    downloadUrlResolver: async (receivedFile) => {
      assert.equal(receivedFile, file);
      return 'https://storage.example/catalogo.webp';
    },
    imagePath: 'productos/product_1/catalogo.webp',
    storage
  });
  assert.deepEqual(result, {
    path: 'productos/product_1/catalogo.webp',
    url: 'https://storage.example/catalogo.webp'
  });
});

test('rechaza imágenes mayores a un megabyte', async () => {
  const { storage } = buildStorage({
    contentType: 'image/webp',
    size: String(1024 * 1024 + 1)
  });
  await assert.rejects(
    requireStoredRetailImage({
      downloadUrlResolver: async () => 'unused',
      imagePath: 'productos/product_1/catalogo.webp',
      storage
    }),
    (error) => error instanceof RetailInventoryError
  );
});

test('rechaza archivos que no sean WebP', async () => {
  const { storage } = buildStorage({
    contentType: 'image/jpeg',
    size: '1000'
  });
  await assert.rejects(
    requireStoredRetailImage({
      downloadUrlResolver: async () => 'unused',
      imagePath: 'productos/product_1/catalogo.webp',
      storage
    }),
    (error) => error instanceof RetailInventoryError
  );
});
