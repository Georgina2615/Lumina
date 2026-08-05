import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createClinicalSessionForm,
  getClinicalSessionCompletionError,
  mapClinicalSession,
  sortClinicalSessions
} from '../src/modules/clinical/sessions/services/ClinicalSessionPolicy.js';

// Crea un seguimiento nuevo con el servicio reservado
test('creates an empty session from the scheduled treatment', () => {
  const session = createClinicalSessionForm(null, 'Limpieza facial');

  assert.equal(session.performedTreatment, 'Limpieza facial');
  assert.equal(session.photos.beforePath, '');
});

// Explica el requisito clínico pendiente
test('requires the technical record before completion', () => {
  const session = createClinicalSessionForm(null, 'Limpieza facial');

  assert.match(
    getClinicalSessionCompletionError({ recordStatus: 'draft', session }),
    /Completa la ficha técnica/
  );
});

// Acepta un seguimiento completo sin fotografías
test('accepts complete notes without mandatory photos', () => {
  const session = {
    ...createClinicalSessionForm(null, 'Limpieza facial'),
    afterObservations: 'Sin reacciones visibles',
    beforeObservations: 'Piel ligeramente deshidratada'
  };

  assert.equal(
    getClinicalSessionCompletionError({ recordStatus: 'completed', session }),
    null
  );
});

// Convierte y ordena sesiones persistidas
test('maps and orders stored clinical sessions', () => {
  const older = mapClinicalSession('old', {
    appointmentDate: '2026-08-01',
    appointmentId: 'old',
    clientId: 'client-1',
    revision: 1,
    scheduledTime: '10:00',
    schemaVersion: 1,
    status: 'completed'
  });
  const recent = mapClinicalSession('recent', {
    appointmentDate: '2026-08-03',
    appointmentId: 'recent',
    clientId: 'client-1',
    revision: 1,
    scheduledTime: '17:00',
    schemaVersion: 1,
    status: 'completed'
  });

  assert.deepEqual(
    sortClinicalSessions([older, recent]).map(({ appointmentId }) => appointmentId),
    ['recent', 'old']
  );
});
