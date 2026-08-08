import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicProductCatalogHandler } from '../src/GetPublicProductCatalog.js';
import { mapPublicProduct } from '../src/PublicProductDocuments.js';

const snapshot = (id, data) => ({ exists: true, id, data: () => data });
const product = {
  activo: true,
  categoria: 'Protector solar',
  descripcion: 'Protección diaria',
  existencias: 30,
  imagenUrl: 'https://example.com/product.webp',
  marca: 'Lumina',
  nombre: 'Protector facial',
  precioCentavos: 45000,
  schemaVersion: 1
};

test('expone solo información comercial del producto', () => {
  assert.deepEqual(mapPublicProduct(snapshot('product-1', {
    ...product,
    costoPromedioCentavos: 10000,
    auditoria: { creadaPor: 'admin' }
  })), {
    available: true,
    brand: 'Lumina',
    category: 'Protector solar',
    description: 'Protección diaria',
    id: 'product-1',
    imageUrl: 'https://example.com/product.webp',
    name: 'Protector facial',
    priceCents: 45000
  });
});

test('conserva un producto agotado sin mostrar cantidades', () => {
  const mapped = mapPublicProduct(snapshot('product-1', {
    ...product,
    existencias: 0
  }));
  assert.equal(mapped.available, false);
  assert.equal('stock' in mapped, false);
  assert.equal('existencias' in mapped, false);
});

test('consulta y ordena únicamente productos válidos', async () => {
  const documents = [
    snapshot('agotado', { ...product, existencias: 0, nombre: 'Agotado' }),
    snapshot('available', product),
    snapshot('invalid', { ...product, precioCentavos: 0 })
  ];
  const query = {
    get: async () => ({ docs: documents }),
    limit: () => query,
    where: () => query
  };
  const firestore = { collection: () => query };
  const result = await getPublicProductCatalogHandler({ firestore });

  assert.deepEqual(result.products.map(({ id }) => id), ['available', 'agotado']);
  assert.equal(result.warningCount, 1);
});
