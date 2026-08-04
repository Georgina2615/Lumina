import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ServiceCatalogError,
  validateManageServiceCatalogRequest
} from '../src/ServiceCatalogPolicy.js';
import {
  requireServiceCanActivate,
  requireServiceCatalogAdmin,
  requireStoredService,
  resolveServiceOrder
} from '../src/ServiceCatalogStoredPolicy.js';

// Construye una captura sencilla
const buildSnapshot = (data) => ({
  exists: data !== null,
  data: () => data
});

// Construye un servicio operativo
const buildService = (overrides = {}) => ({
  nombre: 'Limpieza facial profunda',
  descripcionPublica: '',
  precioCentavos: 45_000,
  duracionServicioMinutos: 150,
  tiempoPreparacionMinutos: 30,
  duracionBloqueMinutos: 180,
  porcentajeAnticipo: 30,
  activo: false,
  orden: 1,
  ...overrides
});

test('permite administrar solo a una administradora activa', () => {
  assert.doesNotThrow(() => requireServiceCatalogAdmin(buildSnapshot({
    activo: true,
    rol: 'admin'
  })));
  assert.throws(
    () => requireServiceCatalogAdmin(buildSnapshot({
      activo: true,
      rol: 'recepcion'
    })),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'permission-denied'
  );
  assert.throws(
    () => requireServiceCatalogAdmin(buildSnapshot({
      activo: false,
      rol: 'admin'
    })),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'permission-denied'
  );
});

test('rechaza una revision anterior', () => {
  assert.throws(
    () => requireStoredService(buildSnapshot(buildService({
      revision: 2
    })), 1),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'aborted'
  );
});

test('impide ofrecer un servicio con reglas incompatibles', () => {
  assert.doesNotThrow(() => requireServiceCanActivate(buildService()));
  assert.doesNotThrow(() => requireServiceCanActivate(buildService({
    descripcionPublica: undefined
  })));
  assert.throws(
    () => requireServiceCanActivate(buildService({
      duracionBloqueMinutos: 120
    })),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'failed-precondition'
  );
  assert.throws(
    () => requireServiceCanActivate(buildService({ orden: 0 })),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'failed-precondition'
  );
  assert.throws(
    () => requireServiceCanActivate(buildService({
      descripcionPublica: 'a'.repeat(501)
    })),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'failed-precondition'
  );
});

test('exige una letra y caracteres comerciales en el nombre', () => {
  const request = {
    action: 'create',
    operationId: 'operation_name',
    serviceId: 'service_name',
    name: 'Vitamina C 10% + LED',
    publicDescription: '',
    priceCents: 50_000
  };

  assert.doesNotThrow(() => validateManageServiceCatalogRequest(request));
  assert.throws(
    () => validateManageServiceCatalogRequest({ ...request, name: '211' }),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'invalid-argument'
  );
  assert.throws(
    () => validateManageServiceCatalogRequest({
      ...request,
      name: 'Facial con brillo ✨'
    }),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'invalid-argument'
  );
});

test('conserva o calcula una posicion segura', () => {
  const catalogSnapshot = {
    docs: [
      { id: 'first', data: () => ({ orden: 2 }) },
      { id: 'current', data: () => ({ orden: 0 }) }
    ]
  };

  assert.equal(resolveServiceOrder({
    catalogSnapshot,
    serviceId: 'new'
  }), 3);
  assert.equal(resolveServiceOrder({
    catalogSnapshot,
    serviceId: 'current',
    storedOrder: 7
  }), 7);
  assert.equal(resolveServiceOrder({
    catalogSnapshot,
    serviceId: 'current',
    storedOrder: 0
  }), 3);
});

test('detiene el alta cuando no existe otra posicion', () => {
  const catalogSnapshot = {
    docs: [{ id: 'last', data: () => ({ orden: 999 }) }]
  };

  assert.throws(
    () => resolveServiceOrder({
      catalogSnapshot,
      serviceId: 'new'
    }),
    (error) => error instanceof ServiceCatalogError
      && error.code === 'resource-exhausted'
  );
});
