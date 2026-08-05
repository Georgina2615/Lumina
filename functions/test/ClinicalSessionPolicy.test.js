import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildClinicalSessionRequestHash,
  validateClinicalSessionRequest
} from '../src/ClinicalSessionPolicy.js';

const validRequest = () => ({
  appointmentId: 'appointment-1',
  clientId: 'client-1',
  expectedRevision: 0,
  operationId: 'operation-1',
  session: {
    afterObservations: 'Piel calmada al finalizar',
    beforeObservations: 'Ligera resequedad en mejillas',
    performedTreatment: 'Limpieza facial profunda',
    photoConsentGranted: true,
    photos: {
      afterPath: 'sesiones-clinicas/client-1/appointment-1/after.webp',
      beforePath: 'sesiones-clinicas/client-1/appointment-1/before.webp'
    }
  },
  status: 'completed'
});

// Verifica el contrato completo de una sesión
test('accepts a complete clinical session', () => {
  const request = validateClinicalSessionRequest(validRequest());

  assert.equal(request.status, 'completed');
  assert.equal(request.session.photoConsentGranted, true);
  assert.equal(buildClinicalSessionRequestHash(request).length, 64);
});

// Rechaza fotografías sin autorización registrada
test('rejects photos without consent', () => {
  const request = validRequest();
  request.session.photoConsentGranted = false;

  assert.throws(
    () => validateClinicalSessionRequest(request),
    /Registra la autorización/
  );
});

// Rechaza rutas ajenas a la cita
test('rejects a photo path from another appointment', () => {
  const request = validRequest();
  request.session.photos.beforePath = 'sesiones-clinicas/client-1/other/before.webp';

  assert.throws(
    () => validateClinicalSessionRequest(request),
    /ruta de fotografía no es válida/
  );
});

// Exige observaciones y tratamiento al completar
test('requires the completed session notes', () => {
  const request = validRequest();
  request.session.afterObservations = '';

  assert.throws(
    () => validateClinicalSessionRequest(request),
    /observaciones finales es obligatorio/
  );
});
