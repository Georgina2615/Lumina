import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEmptyClinicalRecord,
  getClinicalCompletionError
} from '../src/modules/clinical/records/services/ClinicalRecordPolicy.js';

test('crea una ficha vacía con todas sus secciones', () => {
  const record = createEmptyClinicalRecord();

  assert.equal(record.personalDetails.pregnancies, 0);
  assert.deepEqual(record.precautions.conditions, []);
  assert.deepEqual(record.skinAnalysis.skinTypes, []);
});

test('explica el primer requisito pendiente', () => {
  const record = createEmptyClinicalRecord();

  assert.equal(
    getClinicalCompletionError(record),
    'Escribe la fecha de nacimiento'
  );
});

test('acepta una ficha con respuestas indispensables', () => {
  const record = createEmptyClinicalRecord();
  record.personalDetails.birthDate = '2000-05-20';
  record.history.generalHealth = 'good';
  record.history.pregnancyStatus = 'none';
  record.history.allergies = 'Ninguna';
  record.history.medications = 'Ninguno';
  record.precautions.hasNoKnownConditions = true;
  record.skinAnalysis.hydration = 'normal';
  record.skinAnalysis.sebum = 'normal';
  record.skinAnalysis.skinTypes = ['normal'];
  record.skinAnalysis.aestheticAssessment = 'Piel equilibrada';
  record.skinAnalysis.treatmentRationale = 'Mantener hidratación';

  assert.equal(getClinicalCompletionError(record), null);
});
