import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSkinTestConfigHash,
  SkinTestConfigError,
  validateSkinTestConfigRequest
} from '../src/SkinTestConfigPolicy.js';
import {
  requireSkinTestCatalog,
  requireSkinTestRevision
} from '../src/SkinTestConfigStoredPolicy.js';

const resultKeys = ['basica', 'profunda', 'acne', 'manchas', 'edad'];

// Crea una solicitud completa de configuración
const createRequest = (overrides = {}) => ({
  active: true,
  expectedRevision: 0,
  operationId: 'operation-test-1',
  questions: [1, 2, 3].map((number) => ({
    id: `question-${number}`,
    options: [
      {
        id: `answer-${number}-a`,
        label: 'Primera respuesta',
        points: 1,
        requiresContact: false,
        resultKey: 'basica'
      },
      {
        id: `answer-${number}-b`,
        label: 'Segunda respuesta',
        points: 2,
        requiresContact: number === 3,
        resultKey: 'profunda'
      }
    ],
    order: number,
    text: `Pregunta de prueba número ${number}`
  })),
  results: Object.fromEntries(resultKeys.map((key) => [key, {
    productIds: key === 'basica' ? ['product-1'] : [],
    serviceId: `service-${key}`,
    summary: 'Explicación pública suficientemente clara para este resultado',
    title: `Resultado ${key}`
  }])),
  ...overrides
});

const createSnapshot = (id, data) => ({
  id,
  exists: Boolean(data),
  data: () => data
});

test('normaliza una configuración publicable completa', () => {
  const result = validateSkinTestConfigRequest(createRequest());
  assert.equal(result.questions.length, 3);
  assert.equal(result.results.basica.productIds[0], 'product-1');
  assert.equal(result.active, true);
});

test('permite un borrador sin servicios relacionados', () => {
  const source = createRequest({ active: false });
  source.results = Object.fromEntries(resultKeys.map((key) => [key, {
    ...source.results[key],
    serviceId: ''
  }]));
  assert.equal(validateSkinTestConfigRequest(source).active, false);
});

test('impide publicar resultados sin servicio', () => {
  const source = createRequest();
  source.results.basica.serviceId = '';
  assert.throws(
    () => validateSkinTestConfigRequest(source),
    (error) => error instanceof SkinTestConfigError
      && error.code === 'failed-precondition'
  );
});

test('rechaza más de tres productos por resultado', () => {
  const source = createRequest();
  source.results.basica.productIds = ['product-1', 'product-2', 'product-3', 'product-4'];
  assert.throws(
    () => validateSkinTestConfigRequest(source),
    (error) => error.code === 'invalid-argument'
  );
});

test('exige servicios y productos activos', () => {
  const request = validateSkinTestConfigRequest(createRequest());
  const services = resultKeys.map((key) => createSnapshot(
    `service-${key}`,
    { activo: true }
  ));
  const products = [createSnapshot('product-1', { activo: false })];
  assert.throws(
    () => requireSkinTestCatalog({ products, request, services }),
    (error) => error.code === 'failed-precondition'
  );
});

test('detecta una revisión diferente y conserva una huella estable', () => {
  const request = validateSkinTestConfigRequest(createRequest());
  assert.equal(
    buildSkinTestConfigHash(request),
    buildSkinTestConfigHash(request)
  );
  assert.throws(
    () => requireSkinTestRevision(createSnapshot('principal', { revision: 2 }), 1),
    (error) => error.code === 'aborted'
  );
});
