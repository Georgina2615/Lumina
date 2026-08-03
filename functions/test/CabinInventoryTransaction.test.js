import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runManageCabinSupplyTransaction
} from '../src/ManageCabinSupplyTransaction.js';

// Construye una captura compatible con Firestore
const buildSnapshot = (reference, data) => ({
  id: reference.id,
  exists: data !== undefined,
  data: () => data
});

// Construye una base transaccional en memoria
const buildFirestore = (seed) => {
  const writes = [];
  const collection = (name) => ({
    doc: (id) => ({ id, path: `${name}/${id}` })
  });
  const transaction = {
    getAll: async (...references) => references.map(
      (reference) => buildSnapshot(reference, seed[reference.path])
    ),
    create: (reference, data) => writes.push({
      type: 'create',
      path: reference.path,
      data
    }),
    set: (reference, data) => writes.push({
      type: 'set',
      path: reference.path,
      data
    }),
    update: (reference, data) => writes.push({
      type: 'update',
      path: reference.path,
      data
    })
  };
  return {
    firestore: {
      collection,
      runTransaction: (callback) => callback(transaction)
    },
    writes
  };
};

// Busca una escritura por ruta
const findWrite = (writes, path) => writes.find(
  (write) => write.path === path
);

// Construye un insumo persistido
const buildStoredSupply = (overrides = {}) => ({
  schemaVersion: 1,
  nombre: 'Ácido salicílico',
  marca: 'Marca profesional',
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

// Construye el valor privado persistido
const buildStoredCost = (value = 30_000) => ({
  schemaVersion: 1,
  insumoId: 'supply_1',
  valorInventarioCentavos: value,
  sucursalId: 'principal'
});

test('crea un insumo con cantidad costo y movimiento inicial', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' }
  });
  const result = await runManageCabinSupplyTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'create',
      operationId: 'operation_1',
      supplyId: 'supply_new',
      name: 'Gasas estériles',
      brand: '',
      category: 'Desechables',
      description: '',
      unit: 'pieza',
      initialQuantityScaled: 100,
      minimumStockScaled: 20,
      inventoryValueCents: 5_000
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.stockScaled, 100);
  assert.equal(result.inventoryValueCents, 5_000);
  assert.equal(result.revision, 1);
  assert.equal(
    findWrite(writes, 'insumosCabina/supply_new')
      .data.existenciasEscaladas,
    100
  );
  assert.equal(
    findWrite(writes, 'costosInsumosCabina/supply_new')
      .data.valorInventarioCentavos,
    5_000
  );
  assert.equal(
    findWrite(writes, 'movimientosInsumosCabina/operation_1').data.tipo,
    'entrada_inicial'
  );
});

test('reabastece existencias y suma el costo total', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'insumosCabina/supply_1': buildStoredSupply(),
    'costosInsumosCabina/supply_1': buildStoredCost()
  });
  const result = await runManageCabinSupplyTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'adjust_stock',
      operationId: 'operation_2',
      supplyId: 'supply_1',
      expectedRevision: 2,
      type: 'entrada_reabastecimiento',
      quantityScaled: 250_000,
      reason: 'Compra a proveedor',
      reference: 'FACTURA 1',
      totalCostCents: 18_000
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.stockScaled, 750_000);
  assert.equal(result.inventoryValueCents, 48_000);
  assert.equal(result.revision, 3);
  assert.equal(
    findWrite(writes, 'costosInsumosCabina/supply_1')
      .data.valorInventarioCentavos,
    48_000
  );
  const movement = findWrite(
    writes,
    'movimientosInsumosCabina/operation_2'
  );
  assert.equal(movement.data.cambioExistenciasEscalado, 250_000);
  assert.equal(movement.data.costoTotalCentavos, 18_000);
});

test('corrige existencias conservando el costo promedio', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'insumosCabina/supply_1': buildStoredSupply({
      existenciasEscaladas: 3_000
    }),
    'costosInsumosCabina/supply_1': buildStoredCost(10_000)
  });
  const result = await runManageCabinSupplyTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'adjust_stock',
      operationId: 'operation_positive_adjustment',
      supplyId: 'supply_1',
      expectedRevision: 2,
      type: 'ajuste_positivo',
      quantityScaled: 1_000,
      reason: 'Corrección de conteo',
      reference: '',
      totalCostCents: null
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.stockScaled, 4_000);
  assert.equal(result.inventoryValueCents, 13_333);
  assert.equal(
    findWrite(writes, 'costosInsumosCabina/supply_1')
      .data.valorInventarioCentavos,
    13_333
  );
});

test('descuenta una merma y reduce su valor proporcional', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'insumosCabina/supply_1': buildStoredSupply({
      existenciasEscaladas: 3_000
    }),
    'costosInsumosCabina/supply_1': buildStoredCost(10_000)
  });
  const result = await runManageCabinSupplyTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'adjust_stock',
      operationId: 'operation_3',
      supplyId: 'supply_1',
      expectedRevision: 2,
      type: 'salida_merma',
      quantityScaled: 1_000,
      reason: 'Derrame accidental',
      reference: '',
      totalCostCents: null
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.stockScaled, 2_000);
  assert.equal(result.inventoryValueCents, 6_667);
  const movement = findWrite(
    writes,
    'movimientosInsumosCabina/operation_3'
  );
  assert.equal(movement.data.valorRetiradoCentavos, 3_333);
  assert.equal(movement.data.valorInventarioPosteriorCentavos, 6_667);
});

test('edita datos sin cambiar unidad existencias ni costo', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'insumosCabina/supply_1': buildStoredSupply(),
    'costosInsumosCabina/supply_1': buildStoredCost()
  });
  const result = await runManageCabinSupplyTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'update',
      operationId: 'operation_4',
      supplyId: 'supply_1',
      expectedRevision: 2,
      name: 'Ácido salicílico renovado',
      brand: '',
      category: 'Activos',
      description: 'Uso profesional',
      minimumStockScaled: 60_000
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  const update = findWrite(writes, 'insumosCabina/supply_1').data;
  assert.equal(result.inventoryValueCents, 30_000);
  assert.equal(update.nombre, 'Ácido salicílico renovado');
  assert.equal(Object.hasOwn(update, 'unidad'), false);
  assert.equal(Object.hasOwn(update, 'existenciasEscaladas'), false);
  assert.equal(
    writes.some((write) => write.path === 'costosInsumosCabina/supply_1'),
    false
  );
});
