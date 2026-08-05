import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAgeOnDate,
  validateClinicalConsentSignRequest
} from '../src/ClinicalConsentPolicy.js';
import {
  clinicalConsentTemplate,
  clinicalConsentTemplateHash
} from '../src/ClinicalConsentTemplate.js';

const buildRequest = (overrides = {}) => ({
  acceptedStatementIds: clinicalConsentTemplate.statements.map(({ id }) => id),
  action: 'sign',
  appointmentId: 'appointment-1',
  clientId: 'client-1',
  clinicalPhotosAllowed: true,
  marketingPhotosAllowed: false,
  operationId: 'operation-1',
  signaturePath: 'consentimientos-clinicos/client-1/appointment-1/firma.webp',
  templateHash: clinicalConsentTemplateHash,
  templateId: clinicalConsentTemplate.id,
  ...overrides
});

test('acepta el contrato completo y decisiones independientes', () => {
  const request = validateClinicalConsentSignRequest(buildRequest());
  assert.equal(request.clinicalPhotosAllowed, true);
  assert.equal(request.marketingPhotosAllowed, false);
});

test('rechaza una declaración obligatoria ausente', () => {
  assert.throws(() => validateClinicalConsentSignRequest(buildRequest({
    acceptedStatementIds: ['adult']
  })), /todas las declaraciones/);
});

test('rechaza una firma que pertenece a otra ruta', () => {
  assert.throws(() => validateClinicalConsentSignRequest(buildRequest({
    signaturePath: 'consentimientos-clinicos/client-2/appointment-1/firma.webp'
  })), /no corresponde/);
});

test('calcula dieciocho años cumplidos en la fecha de cita', () => {
  assert.equal(calculateAgeOnDate('2008-08-05', '2026-08-05'), 18);
  assert.equal(calculateAgeOnDate('2008-08-06', '2026-08-05'), 17);
});
