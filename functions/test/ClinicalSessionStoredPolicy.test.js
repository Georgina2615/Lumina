import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findPreviousClinicalSession,
  requireConsentForSession,
  requireClinicalRecordForSession,
  requireClinicalSessionAppointment,
  requireStoredClinicalSession
} from '../src/ClinicalSessionStoredPolicy.js';

const snapshot = (id, data, exists = true) => ({
  data: () => data,
  exists,
  id
});

// Exige una cita en cabina de la misma clienta
test('accepts the matching in cabin appointment', () => {
  const appointment = requireClinicalSessionAppointment({
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    snapshot: snapshot('appointment-1', {
      clienteId: 'client-1',
      estado: 'en_cabina',
      fecha: '2026-08-05',
      hora: '10:00',
      servicio: 'Limpieza facial'
    })
  });

  assert.equal(appointment.servicio, 'Limpieza facial');
});

// Exige la ficha completa al terminar el seguimiento
test('requires a completed technical record for completion', () => {
  assert.throws(() => requireClinicalRecordForSession({
    clientId: 'client-1',
    sessionStatus: 'completed',
    snapshot: snapshot('client-1', {
      clientId: 'client-1',
      revision: 1,
      schemaVersion: 1,
      status: 'draft'
    })
  }), /Completa la ficha técnica/);
});

// Exige consentimiento y respeta su decisión de fotografías
test('requires a signed consent with matching photo choice', () => {
  const signedConsent = snapshot('appointment-1', {
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    clinicalPhotosAllowed: false,
    schemaVersion: 1,
    status: 'signed'
  });
  assert.doesNotThrow(() => requireConsentForSession({
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    session: { photoConsentGranted: false },
    snapshot: signedConsent
  }));
  assert.throws(() => requireConsentForSession({
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    session: { photoConsentGranted: true },
    snapshot: signedConsent
  }), /autorización de fotografías cambió/);
});

// Detecta revisiones desactualizadas
test('rejects a stale clinical session revision', () => {
  assert.throws(() => requireStoredClinicalSession({
    appointmentId: 'appointment-1',
    clientId: 'client-1',
    expectedRevision: 1,
    snapshot: snapshot('appointment-1', {
      appointmentId: 'appointment-1',
      clientId: 'client-1',
      revision: 2,
      schemaVersion: 1
    })
  }), /cambió en otra ventana/);
});

// Selecciona la sesión terminada más reciente
test('finds the most recent completed session', () => {
  const documents = [
    snapshot('old', {
      appointmentId: 'old',
      completedAt: { toMillis: () => 10 },
      performedTreatment: 'Tratamiento anterior',
      status: 'completed'
    }),
    snapshot('new', {
      appointmentId: 'new',
      completedAt: { toMillis: () => 20 },
      performedTreatment: 'Tratamiento reciente',
      status: 'completed'
    })
  ];

  assert.equal(
    findPreviousClinicalSession({ appointmentId: 'current', documents }).id,
    'new'
  );
});
