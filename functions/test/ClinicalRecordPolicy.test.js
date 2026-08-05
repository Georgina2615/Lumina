import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClinicalRecordRequestHash,
  validateClinicalRecordRequest
} from '../src/ClinicalRecordPolicy.js';

const buildRecord = () => ({
  history: {
    alcohol: 'never',
    allergies: 'Ninguna',
    coffee: 'occasional',
    currentRoutine: 'Limpieza e hidratación',
    diet: 'balanced',
    digestion: 'normal',
    generalHealth: 'good',
    medications: 'Ninguno',
    pregnancyStatus: 'none',
    previousTreatments: '',
    sunExposure: 'moderate',
    tobacco: 'never',
    waterGlasses: 8
  },
  personalDetails: {
    address: '',
    birthDate: '2000-05-20',
    cesareans: 0,
    hysterectomy: false,
    occupation: 'Estudiante',
    otherProcedures: '',
    pregnancies: 0,
    surgeries: ''
  },
  precautions: {
    bloodPressureNotes: '',
    conditions: [],
    hasNoKnownConditions: true,
    otherConditions: '',
    skinConditionNotes: ''
  },
  skinAnalysis: {
    acneFactors: [],
    acneNotes: '',
    aestheticAssessment: 'Piel con hidratación conservada',
    coloration: 'normal',
    eyeArea: [],
    flaccidity: [],
    hydration: 'normal',
    lesions: [],
    muscleTone: 'good',
    phototype: 3,
    pigmentation: [],
    pores: ['normal'],
    scars: [],
    sebum: 'normal',
    shine: 'balanced',
    skinTypes: ['normal'],
    surfaceObservations: '',
    texture: ['soft'],
    treatmentRationale: 'Mantener hidratación y protección solar',
    vascularization: [],
    wrinkles: []
  }
});

const buildRequest = (overrides = {}) => ({
  appointmentId: 'appointment-1',
  clientId: 'client-1',
  expectedRevision: 0,
  operationId: 'operation-1',
  record: buildRecord(),
  status: 'completed',
  ...overrides
});

test('normaliza una ficha técnica completa', () => {
  const request = validateClinicalRecordRequest(buildRequest());

  assert.equal(request.record.history.waterGlasses, 8);
  assert.equal(request.record.skinAnalysis.phototype, 3);
  assert.equal(request.status, 'completed');
});

test('permite guardar un borrador incompleto', () => {
  const record = buildRecord();
  record.history.allergies = '';
  record.skinAnalysis.aestheticAssessment = '';
  const request = validateClinicalRecordRequest(buildRequest({ record, status: 'draft' }));

  assert.equal(request.status, 'draft');
});

test('rechaza completar una ficha sin respuestas indispensables', () => {
  const record = buildRecord();
  record.history.medications = '';

  assert.throws(
    () => validateClinicalRecordRequest(buildRequest({ record })),
    /campos indispensables/
  );
});

test('rechaza condiciones contradictorias', () => {
  const record = buildRecord();
  record.precautions.conditions = ['diabetes'];

  assert.throws(
    () => validateClinicalRecordRequest(buildRequest({ record })),
    /se contradicen/
  );
});

test('construye una huella estable del contenido', () => {
  const first = validateClinicalRecordRequest(buildRequest());
  const second = validateClinicalRecordRequest(buildRequest());

  assert.equal(
    buildClinicalRecordRequestHash(first),
    buildClinicalRecordRequestHash(second)
  );
});
