import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildServiceCatalogRequestHash,
  ServiceCatalogError,
  validateManageServiceCatalogRequest
} from '../src/ServiceCatalogPolicy.js';
import {
  requireUniqueServiceName
} from '../src/ServiceCatalogStoredPolicy.js';
import {
  runManageServiceCatalogTransaction
} from '../src/ManageServiceCatalogTransaction.js';

// Copia datos simples entre transacciones
const clone = (value) => (
  value && typeof value === 'object'
    ? structuredClone(value)
    : value
);

// Construye una captura documental
const buildSnapshot = (reference, data) => ({
  id: reference.id,
  exists: data !== undefined,
  data: () => clone(data)
});

// Simula la parte transaccional usada por el catalogo
const buildFirestore = (seed) => {
  const documents = new Map(Object.entries(seed));
  const collection = (name) => ({
    collectionName: name,
    doc: (id) => ({ id, path: `${name}/${id}` })
  });

  return {
    collection,
    get: (path) => documents.get(path),
    runTransaction: async (callback) => {
      const writes = [];
      const transaction = {
        get: async (reference) => {
          if (reference.collectionName) {
            const prefix = `${reference.collectionName}/`;
            const docs = [...documents.entries()]
              .filter(([path]) => (
                path.startsWith(prefix)
                && !path.slice(prefix.length).includes('/')
              ))
              .map(([path, data]) => buildSnapshot({
                id: path.slice(prefix.length),
                path
              }, data));
            return { docs };
          }

          return buildSnapshot(reference, documents.get(reference.path));
        },
        getAll: async (...references) => Promise.all(
          references.map((reference) => transaction.get(reference))
        ),
        create: (reference, data) => writes.push({
          data: clone(data),
          path: reference.path,
          type: 'create'
        }),
        update: (reference, data) => writes.push({
          data: clone(data),
          path: reference.path,
          type: 'update'
        })
      };
      const result = await callback(transaction);

      writes.forEach((write) => {
        if (write.type === 'create') {
          assert.equal(documents.has(write.path), false);
          documents.set(write.path, write.data);
        } else {
          documents.set(write.path, {
            ...documents.get(write.path),
            ...write.data
          });
        }
      });

      return result;
    }
  };
};

// Construye una solicitud valida
const buildRequest = (overrides = {}) => ({
  action: 'create',
  operationId: 'operation_123',
  serviceId: 'service_123',
  name: 'Vitamina C 10',
  publicDescription: 'Tratamiento iluminador',
  priceCents: 50_000,
  ...overrides
});

// Construye un servicio heredado valido
const buildLegacyService = (overrides = {}) => ({
  nombre: 'Limpieza facial profunda',
  precioCentavos: 45_000,
  duracionServicioMinutos: 150,
  tiempoPreparacionMinutos: 30,
  duracionBloqueMinutos: 180,
  porcentajeAnticipo: 30,
  activo: true,
  orden: 1,
  ...overrides
});

test('normaliza un alta y rechaza la posicion del navegador', () => {
  const request = validateManageServiceCatalogRequest(buildRequest());

  assert.equal(request.name, 'Vitamina C 10');
  assert.equal('order' in request, false);
  assert.equal(buildServiceCatalogRequestHash(request).length, 64);
  assert.throws(
    () => validateManageServiceCatalogRequest({
      ...buildRequest(),
      order: 6
    }),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'invalid-argument'
  );
});

test('detecta nombres repetidos sin depender de acentos', () => {
  const catalogSnapshot = {
    docs: [{
      id: 'existing',
      data: () => ({ nombre: 'Anti acné' })
    }]
  };

  assert.throws(
    () => requireUniqueServiceName({
      catalogSnapshot,
      name: '  anti acne ',
      serviceId: 'new'
    }),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'already-exists'
  );
});

test('crea un servicio con reglas fijas e historial privado', async () => {
  const firestore = buildFirestore({
    'usuarios/admin': { activo: true, rol: 'admin' },
    'servicios/existing': buildLegacyService()
  });
  const request = validateManageServiceCatalogRequest(buildRequest());
  const result = await runManageServiceCatalogTransaction({
    actorUid: 'admin',
    firestore,
    request,
    requestHash: buildServiceCatalogRequestHash(request),
    serverTimestamp: () => 'timestamp'
  });

  const service = firestore.get('servicios/service_123');
  const change = firestore.get('cambiosServicios/operation_123');

  assert.equal(result.revision, 1);
  assert.equal(service.duracionServicioMinutos, 150);
  assert.equal(service.tiempoPreparacionMinutos, 30);
  assert.equal(service.duracionBloqueMinutos, 180);
  assert.equal(service.porcentajeAnticipo, 30);
  assert.equal(service.activo, false);
  assert.equal(service.orden, 2);
  assert.equal(change.actorUid, 'admin');
  assert.equal(firestore.get('citas/service_123'), undefined);
});

test('actualiza un servicio heredado sin cambiar citas', async () => {
  const firestore = buildFirestore({
    'usuarios/admin': { activo: true, rol: 'admin' },
    'servicios/service_123': buildLegacyService()
  });
  const request = validateManageServiceCatalogRequest(buildRequest({
    action: 'update',
    expectedRevision: 0,
    name: 'Limpieza facial renovada',
    operationId: 'operation_456',
    priceCents: 47_500,
    publicDescription: 'Descripción actualizada'
  }));

  await runManageServiceCatalogTransaction({
    actorUid: 'admin',
    firestore,
    request,
    requestHash: buildServiceCatalogRequestHash(request),
    serverTimestamp: () => 'timestamp'
  });

  const service = firestore.get('servicios/service_123');

  assert.equal(service.precioCentavos, 47_500);
  assert.equal(service.descripcionPublica, 'Descripción actualizada');
  assert.equal(service.orden, 1);
  assert.equal(service.revision, 1);
  assert.equal(firestore.get('citas/service_123'), undefined);

  const change = firestore.get('cambiosServicios/operation_456');
  assert.equal(change.antes.precioCentavos, 45_000);
  assert.equal(change.despues.precioCentavos, 47_500);

  const statusRequest = validateManageServiceCatalogRequest({
    action: 'set_active',
    active: false,
    expectedRevision: 1,
    operationId: 'operation_status',
    serviceId: 'service_123'
  });
  const statusResult = await runManageServiceCatalogTransaction({
    actorUid: 'admin',
    firestore,
    request: statusRequest,
    requestHash: buildServiceCatalogRequestHash(statusRequest),
    serverTimestamp: () => 'timestamp'
  });

  assert.equal(statusResult.active, false);
  assert.equal(firestore.get('servicios/service_123').revision, 2);

  const activationRequest = validateManageServiceCatalogRequest({
    action: 'set_active',
    active: true,
    expectedRevision: 2,
    operationId: 'operation_activation',
    serviceId: 'service_123'
  });
  const activationResult = await runManageServiceCatalogTransaction({
    actorUid: 'admin',
    firestore,
    request: activationRequest,
    requestHash: buildServiceCatalogRequestHash(activationRequest),
    serverTimestamp: () => 'timestamp'
  });

  assert.equal(activationResult.active, true);
  assert.equal(firestore.get('servicios/service_123').revision, 3);
});

test('devuelve el mismo resultado al repetir una operacion', async () => {
  const request = validateManageServiceCatalogRequest(buildRequest());
  const requestHash = buildServiceCatalogRequestHash(request);
  const firestore = buildFirestore({
    'usuarios/admin': { activo: true, rol: 'admin' }
  });

  await runManageServiceCatalogTransaction({
    actorUid: 'admin',
    firestore,
    request,
    requestHash,
    serverTimestamp: () => 'timestamp'
  });
  const retry = await runManageServiceCatalogTransaction({
    actorUid: 'admin',
    firestore,
    request,
    requestHash,
    serverTimestamp: () => 'timestamp'
  });

  assert.equal(retry.alreadyProcessed, true);
  assert.equal(retry.revision, 1);

  await assert.rejects(
    runManageServiceCatalogTransaction({
      actorUid: 'admin',
      firestore,
      request,
      requestHash: 'different_hash',
      serverTimestamp: () => 'timestamp'
    }),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'already-exists'
  );
});
