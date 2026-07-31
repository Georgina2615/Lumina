import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRetailProductUpdate } from '../src/RetailInventoryDocuments.js';
import { buildInventoryMovementDocument } from '../src/SaleDocuments.js';
import { requireRetailProduct } from '../src/StoredProductPolicy.js';

// Construye una captura de producto vendible
const buildProductSnapshot = () => ({
  id: 'product_legacy',
  exists: true,
  data: () => ({
    schemaVersion: 1,
    activo: true,
    nombre: 'Producto heredado',
    categoria: 'Cuidado facial',
    precioCentavos: 20_000,
    existencias: 30,
    stockMinimo: 5
  })
});

test('vende productos heredados aunque todavía no tengan costo privado', () => {
  const product = requireRetailProduct(
    buildProductSnapshot(),
    { productId: 'product_legacy', quantity: 2 },
    { exists: false }
  );
  assert.equal(product.unitCostCents, null);
  assert.equal(product.remainingStock, 28);
  const movement = buildInventoryMovementDocument({
    actorUid: 'reception_1',
    product,
    saleId: 'sale_1',
    timestamp: 'timestamp'
  });
  assert.equal(movement.costoUnitarioCentavos, null);
  assert.equal(movement.costoTotalCentavos, null);
});

test('congela el costo privado en una salida de venta', () => {
  const product = requireRetailProduct(
    buildProductSnapshot(),
    { productId: 'product_legacy', quantity: 2 },
    {
      exists: true,
      data: () => ({
        schemaVersion: 1,
        productoId: 'product_legacy',
        costoPromedioCentavos: 12_500
      })
    }
  );
  const movement = buildInventoryMovementDocument({
    actorUid: 'reception_1',
    product,
    saleId: 'sale_2',
    timestamp: 'timestamp'
  });
  assert.equal(movement.costoUnitarioCentavos, 12_500);
  assert.equal(movement.costoTotalCentavos, 25_000);
});

test('ignora un costo incompatible para no bloquear la venta', () => {
  const product = requireRetailProduct(
    buildProductSnapshot(),
    { productId: 'product_legacy', quantity: 1 },
    {
      exists: true,
      data: () => ({
        schemaVersion: 1,
        productoId: 'another_product',
        costoPromedioCentavos: 12_500
      })
    }
  );
  assert.equal(product.unitCostCents, null);
});

test('moderniza un producto heredado sin cambiar existencias ni costo', () => {
  const update = buildRetailProductUpdate({
    actorUid: 'admin_1',
    product: buildProductSnapshot().data(),
    request: {
      action: 'update',
      operationId: 'operation_legacy',
      productId: 'product_legacy',
      expectedRevision: 0,
      name: 'Producto actualizado',
      brand: 'Marca real',
      category: 'Cuidado facial',
      description: 'Descripción vigente',
      priceCents: 22_000,
      minimumStock: 6
    },
    timestamp: 'timestamp'
  });
  assert.equal(update.revision, 1);
  assert.equal(update.marca, 'Marca real');
  assert.match(update.sku, /^LS-[A-F0-9]{10}$/);
  assert.equal(Object.hasOwn(update, 'existencias'), false);
  assert.equal(Object.hasOwn(update, 'costoPromedioCentavos'), false);
});
