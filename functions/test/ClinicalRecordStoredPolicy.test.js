import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getExistingClinicalOperation,
  requireActiveClinicalAppointment,
  requireClinicalActor,
  requireClinicalRecordStatusTransition,
  requireStoredClinicalRecord
} from '../src/ClinicalRecordStoredPolicy.js';

const buildSnapshot = (id, data, exists = true) => ({
  data: () => data,
  exists,
  id
});

test('permite únicamente a la cosmetóloga activa', () => {
  const validActor = buildSnapshot('actor-1', { activo: true, rol: 'cosmetologa' });
  const invalidActor = buildSnapshot('actor-2', { activo: true, rol: 'admin' });

  assert.doesNotThrow(() => requireClinicalActor(validActor));
  assert.throws(() => requireClinicalActor(invalidActor), /no puede guardar/);
});

test('exige una cita en cabina de la misma clienta', () => {
  const snapshot = buildSnapshot('appointment-1', {
    clienteId: 'client-1',
    estado: 'en_cabina'
  });

  assert.doesNotThrow(() => requireActiveClinicalAppointment({
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    snapshot
  }));
  assert.throws(() => requireActiveClinicalAppointment({
    appointmentId: 'appointment-1',
    clientId: 'client-2',
    snapshot
  }), /debe estar en cabina/);
});

test('exige la revisión vigente del expediente', () => {
  const snapshot = buildSnapshot('client-1', {
    clientId: 'client-1',
    revision: 2,
    schemaVersion: 1
  });

  assert.throws(() => requireStoredClinicalRecord({
    clientId: 'client-1',
    expectedRevision: 1,
    snapshot
  }), /otra ventana/);
});

test('impide regresar una ficha completa a borrador', () => {
  assert.throws(
    () => requireClinicalRecordStatusTransition({ status: 'completed' }, 'draft'),
    /no puede regresar/
  );
});

test('devuelve el resultado de un reintento idéntico', () => {
  const result = { clientId: 'client-1', revision: 1, status: 'draft' };
  const storedRecord = {
    lastOperation: { id: 'operation-1', requestHash: 'hash-1', result }
  };

  assert.deepEqual(getExistingClinicalOperation({
    operationId: 'operation-1',
    requestHash: 'hash-1',
    storedRecord
  }), result);
});
