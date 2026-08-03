import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateExpandedInventoryValue,
  calculateCabinInventoryValue,
  calculateCabinStock,
  calculateProportionalInventoryValue
} from '../src/CabinInventoryCalculations.js';
import { CabinInventoryError } from '../src/CabinInventoryError.js';
import {
  buildCabinInventoryRequestHash,
  validateManageCabinSupplyRequest
} from '../src/CabinInventoryRequestPolicy.js';
import {
  mapExistingCabinOperation,
  requireCabinInventoryAdmin,
  requireManagedCabinSupply
} from '../src/CabinInventoryStoredPolicy.js';

// Construye una captura sencilla
const buildSnapshot = (data, id = 'supply_1') => ({
  id,
  exists: data !== null,
  data: () => data
});

// Construye un insumo válido
const buildSupply = (overrides = {}) => ({
  schemaVersion: 1,
  nombre: 'Ácido salicílico',
  marca: '',
  categoria: 'Activos',
  descripcion: '',
  unidad: 'ml',
  factorEscala: 1000,
  existenciasEscaladas: 500_000,
  stockMinimoEscalado: 50_000,
  sucursalId: 'principal',
  activo: true,
  revision: 2,
  ...overrides
});

test('normaliza un alta con cantidad y costo total', () => {
  const request = validateManageCabinSupplyRequest({
    action: 'create',
    operationId: 'operation_123',
    supplyId: 'supply_123',
    name: 'Ácido salicílico',
    brand: '',
    category: 'Activos',
    description: 'Uso profesional',
    unit: 'ml',
    initialQuantityScaled: 500_000,
    minimumStockScaled: 50_000,
    inventoryValueCents: 30_000
  });
  assert.equal(request.brand, '');
  assert.equal(request.initialQuantityScaled, 500_000);
  assert.equal(request.inventoryValueCents, 30_000);
  assert.equal(buildCabinInventoryRequestHash(request).length, 64);
});

test('rechaza cantidades decimales sin escalar', () => {
  assert.throws(
    () => validateManageCabinSupplyRequest({
      action: 'create',
      operationId: 'operation_124',
      supplyId: 'supply_124',
      name: 'Gasas',
      brand: '',
      category: 'Desechables',
      description: '',
      unit: 'pieza',
      initialQuantityScaled: 10.5,
      minimumStockScaled: 2,
      inventoryValueCents: 2_000
    }),
    (error) => error instanceof CabinInventoryError
  );
});

test('impide modificar la unidad después del alta', () => {
  assert.throws(
    () => validateManageCabinSupplyRequest({
      action: 'update',
      operationId: 'operation_125',
      supplyId: 'supply_123',
      expectedRevision: 2,
      name: 'Ácido salicílico',
      brand: '',
      category: 'Activos',
      description: '',
      minimumStockScaled: 40_000,
      unit: 'g'
    }),
    (error) => error instanceof CabinInventoryError
      && error.code === 'invalid-argument'
  );
});

test('exige costo total en cada reabastecimiento', () => {
  assert.throws(
    () => validateManageCabinSupplyRequest({
      action: 'adjust_stock',
      operationId: 'operation_126',
      supplyId: 'supply_123',
      expectedRevision: 2,
      type: 'entrada_reabastecimiento',
      quantityScaled: 100_000,
      reason: 'Compra a proveedor',
      reference: 'FACTURA 1'
    }),
    (error) => error instanceof CabinInventoryError
  );
});

test('rechaza costos en movimientos de salida', () => {
  assert.throws(
    () => validateManageCabinSupplyRequest({
      action: 'adjust_stock',
      operationId: 'operation_127',
      supplyId: 'supply_123',
      expectedRevision: 2,
      type: 'salida_merma',
      quantityScaled: 10_000,
      reason: 'Derrame accidental',
      reference: '',
      totalCostCents: 500
    }),
    (error) => error instanceof CabinInventoryError
  );
});

test('solo permite inventario a administradores activos', () => {
  assert.doesNotThrow(() => requireCabinInventoryAdmin(buildSnapshot({
    activo: true,
    rol: 'admin'
  })));
  assert.throws(
    () => requireCabinInventoryAdmin(buildSnapshot({
      activo: true,
      rol: 'cosmetologa'
    })),
    (error) => error instanceof CabinInventoryError
      && error.code === 'permission-denied'
  );
});

test('rechaza una revisión vencida', () => {
  assert.throws(
    () => requireManagedCabinSupply(buildSnapshot(buildSupply()), 1),
    (error) => error instanceof CabinInventoryError
      && error.code === 'aborted'
  );
});

test('calcula una salida proporcional sin flotantes monetarios', () => {
  const value = calculateProportionalInventoryValue({
    currentValueCents: 10_000,
    previousStockScaled: 3_000,
    nextStockScaled: 2_000
  });
  assert.equal(value, 6_667);
});

test('calcula entradas y bloquea existencias negativas', () => {
  const stock = calculateCabinStock({
    previousStockScaled: 5_000,
    quantityScaled: 2_000,
    type: 'entrada_reabastecimiento'
  });
  assert.equal(stock, 7_000);
  assert.equal(calculateCabinInventoryValue({
    currentValueCents: 4_000,
    previousStockScaled: 5_000,
    nextStockScaled: stock,
    totalCostCents: 1_500,
    type: 'entrada_reabastecimiento'
  }), 5_500);
  assert.throws(
    () => calculateCabinStock({
      previousStockScaled: 1_000,
      quantityScaled: 2_000,
      type: 'salida_merma'
    }),
    (error) => error instanceof CabinInventoryError
      && error.code === 'failed-precondition'
  );
});

test('conserva el costo promedio en una corrección positiva', () => {
  assert.equal(calculateExpandedInventoryValue({
    currentValueCents: 10_000,
    previousStockScaled: 3_000,
    nextStockScaled: 4_000
  }), 13_333);
  assert.equal(calculateCabinInventoryValue({
    currentValueCents: 10_000,
    previousStockScaled: 3_000,
    nextStockScaled: 4_000,
    totalCostCents: null,
    type: 'ajuste_positivo'
  }), 13_333);
});

test('exige costo para ajustar un insumo sin existencias', () => {
  assert.throws(
    () => calculateCabinInventoryValue({
      currentValueCents: 0,
      previousStockScaled: 0,
      nextStockScaled: 1_000,
      totalCostCents: null,
      type: 'ajuste_positivo'
    }),
    (error) => error instanceof CabinInventoryError
      && error.code === 'failed-precondition'
  );
});

test('devuelve el mismo resultado para un reintento idempotente', () => {
  const response = {
    supplyId: 'supply_123',
    operationId: 'operation_128',
    revision: 3
  };
  const existing = mapExistingCabinOperation({
    snapshot: buildSnapshot({
      insumoId: 'supply_123',
      actorUid: 'admin_1',
      idempotencia: { hashSolicitud: 'same_hash' },
      resultado: response
    }, 'operation_128'),
    actorUid: 'admin_1',
    supplyId: 'supply_123',
    requestHash: 'same_hash'
  });
  assert.deepEqual(existing, { ...response, alreadyProcessed: true });
});

test('rechaza reutilizar una operación diferente', () => {
  assert.throws(
    () => mapExistingCabinOperation({
      snapshot: buildSnapshot({
        insumoId: 'supply_123',
        actorUid: 'admin_1',
        idempotencia: { hashSolicitud: 'original_hash' },
        resultado: { revision: 3 }
      }, 'operation_129'),
      actorUid: 'admin_1',
      supplyId: 'supply_123',
      requestHash: 'different_hash'
    }),
    (error) => error instanceof CabinInventoryError
      && error.code === 'already-exists'
  );
});
