import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildPublicSkinQuestionnaire,
  calculatePublicSkinResult,
  PublicSkinTestError,
  requirePublishedSkinTest,
  validatePublicSkinAnswers
} from '../src/PublicSkinTestPolicy.js';
import { evaluatePublicSkinTestHandler } from '../src/PublicSkinTest.js';

// Crea una configuración publicada completa
const createConfig = () => ({
  activo: true,
  preguntas: [
    {
      id: 'question-one',
      options: [
        { id: 'option-one-a', label: 'Opción básica', points: 1, requiresContact: false, resultKey: 'basica' },
        { id: 'option-one-b', label: 'Opción manchas', points: 3, requiresContact: false, resultKey: 'manchas' }
      ],
      order: 1,
      text: 'Primera pregunta válida'
    },
    {
      id: 'question-two',
      options: [
        { id: 'option-two-a', label: 'Opción básica', points: 1, requiresContact: false, resultKey: 'basica' },
        { id: 'option-two-b', label: 'Opción sensible', points: 0, requiresContact: true, resultKey: 'basica' }
      ],
      order: 2,
      text: 'Segunda pregunta válida'
    }
  ],
  recomendaciones: {
    acne: { productIds: [], serviceId: 'service-acne', summary: 'Resumen acné', title: 'Acné' },
    basica: { productIds: [], serviceId: 'service-basic', summary: 'Resumen básico', title: 'Básico' },
    edad: { productIds: [], serviceId: 'service-age', summary: 'Resumen edad', title: 'Edad' },
    manchas: { productIds: [], serviceId: 'service-spots', summary: 'Resumen manchas', title: 'Manchas' },
    profunda: { productIds: [], serviceId: 'service-deep', summary: 'Resumen profundo', title: 'Profundo' }
  },
  revision: 3,
  schemaVersion: 1
});

const createSnapshot = (data, id = 'principal') => ({
  data: () => data,
  exists: Boolean(data),
  id
});

// Crea una base mínima para evaluar referencias reales
const createFirestore = (config) => {
  const documents = new Map([
    ['configuracionTestPiel/principal', config],
    ['servicios/service-spots', {
      activo: true,
      descripcionPublica: 'Cuidado estético del tono',
      duracionServicioMinutos: 150,
      nombre: 'Despigmentante',
      precioCentavos: 50000
    }],
    ['productos/product-one', {
      activo: true,
      descripcion: 'Protección para el cuidado diario',
      existencias: 4,
      marca: 'Marca real',
      nombre: 'Protector solar',
      precioCentavos: 40000
    }]
  ]);
  const createReference = (collectionName, id) => ({
    get: async () => createSnapshot(documents.get(`${collectionName}/${id}`), id),
    id
  });
  return {
    collection: (collectionName) => ({
      doc: (id) => createReference(collectionName, id)
    }),
    getAll: (...references) => Promise.all(references.map((reference) => reference.get()))
  };
};

test('entrega preguntas sin puntajes ni reglas internas', () => {
  const questionnaire = buildPublicSkinQuestionnaire(createConfig());
  assert.equal(questionnaire.revision, 3);
  assert.deepEqual(Object.keys(questionnaire.questions[0].options[0]), ['id', 'label']);
});

test('rechaza una configuración que no está publicada', () => {
  const config = createConfig();
  config.activo = false;
  assert.throws(
    () => requirePublishedSkinTest(createSnapshot(config)),
    (error) => error instanceof PublicSkinTestError && error.code === 'not-found'
  );
});

test('calcula la recomendación con mayor puntuación', () => {
  const config = createConfig();
  const answers = validatePublicSkinAnswers({
    answers: [
      { optionId: 'option-one-b', questionId: 'question-one' },
      { optionId: 'option-two-a', questionId: 'question-two' }
    ],
    revision: 3
  }, config);
  const result = calculatePublicSkinResult(config, answers);
  assert.equal(result.resultKey, 'manchas');
  assert.equal(result.requiresContact, false);
});

test('conserva la recomendación de contacto', () => {
  const config = createConfig();
  const answers = validatePublicSkinAnswers({
    answers: [
      { optionId: 'option-one-a', questionId: 'question-one' },
      { optionId: 'option-two-b', questionId: 'question-two' }
    ],
    revision: 3
  }, config);
  assert.equal(calculatePublicSkinResult(config, answers).requiresContact, true);
});

test('rechaza respuestas incompletas y versiones anteriores', () => {
  const config = createConfig();
  assert.throws(
    () => validatePublicSkinAnswers({ answers: [], revision: 3 }, config),
    (error) => error.code === 'invalid-argument'
  );
  assert.throws(
    () => validatePublicSkinAnswers({ answers: [], revision: 2 }, config),
    (error) => error.code === 'failed-precondition'
  );
});

test('devuelve solo productos disponibles junto al servicio real', async () => {
  const config = createConfig();
  config.recomendaciones.manchas.productIds = ['product-one'];
  const result = await evaluatePublicSkinTestHandler({
    data: {
      answers: [
        { optionId: 'option-one-b', questionId: 'question-one' },
        { optionId: 'option-two-a', questionId: 'question-two' }
      ],
      revision: 3
    },
    firestore: createFirestore(config)
  });
  assert.equal(result.service.name, 'Despigmentante');
  assert.equal(result.products[0].name, 'Protector solar');
});
