import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateWeightedAverageCost
} from '../src/RetailInventoryCalculations.js';
import { RetailInventoryError } from '../src/RetailInventoryError.js';
import {
  buildRetailInventoryRequestHash,
  validateAdjustRetailStockRequest,
  validateManageRetailProductRequest
} from '../src/RetailInventoryRequestPolicy.js';
import {
  mapExistingRetailOperation,
  requireManagedRetailProduct,
  requireRetailAdmin
} from '../src/RetailInventoryStoredPolicy.js';

// Construye una captura sencilla
const buildSnapshot = (data, id = 'product_1') => ({
  id,
  exists: data !== null,
  data: () => data
});

// Construye un producto heredado válido
const buildLegacyProduct = (overrides = {}) => ({
  schemaVersion: 1,
  activo: true,
  nombre: 'Protector solar',
  categoria: 'Protección',
  descripcion: '',
  imagenUrl: '',
  precioCentavos: 45_000,
  existencias: 30,
  stockMinimo: 5,
  ...overrides
});

test('normaliza un alta con costo privado', () => {
  const request = validateManageRetailProductRequest({
    action: 'create',
    operationId: 'operation_123',
    productId: 'product_123',
    name: 'Protector solar',
    brand: 'Marca real',
    category: 'Protección',
    description: 'Protección facial diaria',
    priceCents: 45_000,
    minimumStock: 5,
    unitCostCents: 22_000
  });
  assert.equal(request.name, 'Protector solar');
  assert.equal(request.unitCostCents, 22_000);
  assert.equal(buildRetailInventoryRequestHash(request).length, 64);
});

test('exige costo en cada reabastecimiento', () => {
  assert.throws(
    () => validateAdjustRetailStockRequest({
      operationId: 'operation_124',
      productId: 'product_123',
      expectedRevision: 1,
      type: 'entrada_reabastecimiento',
      quantity: 10,
      reason: 'Compra a proveedor',
      reference: 'FACTURA 1'
    }),
    (error) => error instanceof RetailInventoryError
  );
});

test('solo permite inventario a administradores activos', () => {
  assert.doesNotThrow(() => requireRetailAdmin(buildSnapshot({
    activo: true,
    rol: 'admin'
  })));
  assert.throws(
    () => requireRetailAdmin(buildSnapshot({
      activo: true,
      rol: 'recepcion'
    })),
    (error) => error instanceof RetailInventoryError
      && error.code === 'permission-denied'
  );
  assert.throws(
    () => requireRetailAdmin(buildSnapshot({
      activo: false,
      rol: 'admin'
    })),
    (error) => error instanceof RetailInventoryError
  );
});

test('acepta revisión cero para productos heredados', () => {
  const product = requireManagedRetailProduct(
    buildSnapshot(buildLegacyProduct()),
    0
  );
  assert.equal(product.revision, 0);
  assert.equal(product.stock, 30);
});

test('rechaza una revisión vencida por edición concurrente', () => {
  assert.throws(
    () => requireManagedRetailProduct(
      buildSnapshot(buildLegacyProduct({ revision: 3 })),
      2
    ),
    (error) => error instanceof RetailInventoryError
      && error.code === 'aborted'
  );
});

test('calcula costo promedio ponderado sin flotantes monetarios', () => {
  const average = calculateWeightedAverageCost({
    currentCostCents: 10_000,
    currentStock: 30,
    incomingCostCents: 13_000,
    incomingQuantity: 10
  });
  assert.equal(average, 10_750);
});

test('devuelve el mismo resultado para un reintento idempotente', () => {
  const response = {
    productId: 'product_123',
    operationId: 'operation_125',
    revision: 2
  };
  const existing = mapExistingRetailOperation({
    snapshot: buildSnapshot({
      productoId: 'product_123',
      actorUid: 'admin_1',
      idempotencia: { hashSolicitud: 'same_hash' },
      resultado: response
    }, 'operation_125'),
    actorUid: 'admin_1',
    productId: 'product_123',
    requestHash: 'same_hash'
  });
  assert.deepEqual(existing, { ...response, alreadyProcessed: true });
});

test('rechaza reutilizar una operación con contenido diferente', () => {
  assert.throws(
    () => mapExistingRetailOperation({
      snapshot: buildSnapshot({
        productoId: 'product_123',
        actorUid: 'admin_1',
        idempotencia: { hashSolicitud: 'original_hash' },
        resultado: { revision: 2 }
      }, 'operation_126'),
      actorUid: 'admin_1',
      productId: 'product_123',
      requestHash: 'different_hash'
    }),
    (error) => error instanceof RetailInventoryError
      && error.code === 'already-exists'
  );
});
