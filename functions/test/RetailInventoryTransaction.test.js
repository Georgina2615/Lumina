import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runAdjustRetailStockTransaction
} from '../src/AdjustRetailStockTransaction.js';
import {
  runManageRetailProductTransaction
} from '../src/ManageRetailProductTransaction.js';

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

test('reabastece stock y actualiza el costo promedio en una transacción', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'productos/product_1': {
      schemaVersion: 1,
      activo: true,
      nombre: 'Protector solar',
      categoria: 'Protección',
      precioCentavos: 45_000,
      existencias: 30,
      stockMinimo: 5,
      revision: 2
    },
    'costosProductos/product_1': {
      schemaVersion: 1,
      productoId: 'product_1',
      costoPromedioCentavos: 10_000
    }
  });
  const result = await runAdjustRetailStockTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      operationId: 'operation_1',
      productId: 'product_1',
      expectedRevision: 2,
      type: 'entrada_reabastecimiento',
      quantity: 10,
      reason: 'Compra a proveedor',
      reference: 'FACTURA 1',
      unitCostCents: 13_000
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.currentStock, 40);
  assert.equal(result.averageCostCents, 10_750);
  assert.equal(result.revision, 3);
  assert.equal(
    findWrite(writes, 'productos/product_1').data.existencias,
    40
  );
  assert.equal(
    findWrite(writes, 'costosProductos/product_1')
      .data.costoPromedioCentavos,
    10_750
  );
  const movement = findWrite(writes, 'movimientosInventario/operation_1');
  assert.equal(movement.data.cambioExistencias, 10);
  assert.equal(movement.data.costoTotalCentavos, 130_000);
});

test('moderniza un producto heredado con revisión optimista', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'productos/product_legacy': {
      schemaVersion: 1,
      activo: true,
      nombre: 'Producto heredado',
      categoria: 'Cuidado facial',
      precioCentavos: 20_000,
      existencias: 30,
      stockMinimo: 5
    }
  });
  const result = await runManageRetailProductTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'update',
      operationId: 'operation_2',
      productId: 'product_legacy',
      expectedRevision: 0,
      name: 'Producto actualizado',
      brand: 'Marca real',
      category: 'Cuidado facial',
      description: 'Descripción vigente',
      priceCents: 22_000,
      minimumStock: 6
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.revision, 1);
  assert.equal(result.active, true);
  const update = findWrite(writes, 'productos/product_legacy').data;
  assert.equal(update.marca, 'Marca real');
  assert.match(update.sku, /^LS-[A-F0-9]{10}$/);
  assert.equal(Object.hasOwn(update, 'existencias'), false);
});

test('crea treinta unidades con costo y movimiento inicial', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' }
  });
  const result = await runManageRetailProductTransaction({
    actorUid: 'admin_1',
    firestore,
    request: {
      action: 'create',
      operationId: 'operation_3',
      productId: 'product_new',
      name: 'Limpiador facial',
      brand: 'Marca real',
      category: 'Limpieza',
      description: '',
      priceCents: 30_000,
      minimumStock: 5,
      unitCostCents: 15_000
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.revision, 1);
  assert.equal(
    findWrite(writes, 'productos/product_new').data.existencias,
    30
  );
  assert.equal(
    findWrite(writes, 'costosProductos/product_new')
      .data.costoPromedioCentavos,
    15_000
  );
  const movement = findWrite(writes, 'movimientosInventario/operation_3');
  assert.equal(movement.data.tipo, 'entrada_inicial');
  assert.equal(movement.data.costoTotalCentavos, 450_000);
});

test('versiona la imagen con la nueva revisión del producto', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'productos/product_image': {
      schemaVersion: 1,
      activo: true,
      nombre: 'Protector solar',
      categoria: 'Protección',
      precioCentavos: 45_000,
      existencias: 30,
      stockMinimo: 5,
      revision: 4
    }
  });
  const result = await runManageRetailProductTransaction({
    actorUid: 'admin_1',
    firestore,
    image: {
      path: 'productos/product_image/catalogo.webp',
      url: 'https://storage.example/catalogo.webp?alt=media&token=secure'
    },
    request: {
      action: 'attach_image',
      operationId: 'operation_4',
      productId: 'product_image',
      expectedRevision: 4,
      imagePath: 'productos/product_image/catalogo.webp'
    },
    requestHash: 'request_hash',
    serverTimestamp: () => 'timestamp'
  });
  const expectedUrl = (
    'https://storage.example/catalogo.webp?alt=media&token=secure&v=5'
  );
  assert.equal(result.revision, 5);
  assert.equal(result.imageUrl, expectedUrl);
  assert.equal(
    findWrite(writes, 'productos/product_image').data.imagenUrl,
    expectedUrl
  );
});
