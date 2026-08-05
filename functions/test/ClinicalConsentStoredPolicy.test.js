import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requireAdultCompletedRecord,
  requireSignedClinicalConsent
} from '../src/ClinicalConsentStoredPolicy.js';

const snapshot = (id, data, exists = true) => ({ data: () => data, exists, id });

test('exige mayoría de edad en una ficha completa', () => {
  assert.throws(() => requireAdultCompletedRecord({
    appointmentDate: '2026-08-05',
    clientId: 'client-1',
    snapshot: snapshot('client-1', {
      clientId: 'client-1',
      personalDetails: { birthDate: '2010-01-01' },
      status: 'completed'
    })
  }), /mayores de edad/);
});

test('acepta el consentimiento firmado de la misma cita', () => {
  const consent = requireSignedClinicalConsent({
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    snapshot: snapshot('appointment-1', {
      appointmentId: 'appointment-1',
      clientId: 'client-1',
      schemaVersion: 1,
      status: 'signed'
    })
  });
  assert.equal(consent.status, 'signed');
});
