import assert from 'node:assert/strict';
import test from 'node:test';
import { runCompleteClinicalAttentionTransaction } from '../src/CompleteClinicalAttentionTransaction.js';
import { FakeAppointmentFirestore } from './AppointmentTransactionFixture.js';

const appointmentId = 'appointment_clinical_completion';
const clientId = 'client_clinical_completion';
const slotId = '2026-08-05_10:00';

const buildFirestore = (overrides = {}) => new FakeAppointmentFirestore({
  'usuarios/clinical_actor': { activo: true, rol: 'cosmetologa' },
  [`citas/${appointmentId}`]: {
    clienteId: clientId,
    cupoId: slotId,
    estado: 'en_cabina',
    schemaVersion: 3
  },
  [`cupos/${slotId}`]: { citaId: appointmentId },
  [`expedientesClinicos/${clientId}`]: { clientId, lastAppointmentId: appointmentId, revision: 2, status: 'completed' },
  [`consentimientosClinicos/${appointmentId}`]: { appointmentId, clientId, status: 'signed' },
  [`sesionesClinicas/${appointmentId}`]: { appointmentId, clientId, revision: 3, status: 'completed' },
  [`consumosCabina/${appointmentId}`]: { appointmentId, clientId, status: 'recorded' },
  [`recomendacionesCuidado/${appointmentId}`]: { appointmentId, clientId, revision: 1, status: 'saved' },
  ...overrides
});

test('envía una atención completa a recepción sin liberar el horario', async () => {
  const firestore = buildFirestore();
  const result = await runCompleteClinicalAttentionTransaction({
    actorUid: 'clinical_actor',
    firestore,
    request: { appointmentId, operationId: 'operation_completion_1' },
    serverTimestamp: () => 'timestamp'
  });
  const appointment = firestore.get(`citas/${appointmentId}`);
  assert.equal(result.status, 'por_cobrar');
  assert.equal(appointment.estado, 'por_cobrar');
  assert.equal(appointment.atencionClinica.recomendacionRevision, 1);
  assert.equal(firestore.get(`cupos/${slotId}`).citaId, appointmentId);
  assert.equal(firestore.get(`citas/${appointmentId}/eventos/por_cobrar`).accion, 'finalizar_atencion');
});

test('impide terminar cuando faltan las recomendaciones', async () => {
  const firestore = buildFirestore({
    [`recomendacionesCuidado/${appointmentId}`]: undefined
  });
  await assert.rejects(runCompleteClinicalAttentionTransaction({
    actorUid: 'clinical_actor',
    firestore,
    request: { appointmentId, operationId: 'operation_completion_2' },
    serverTimestamp: () => 'timestamp'
  }), /Guarda las recomendaciones/);
  assert.equal(firestore.get(`citas/${appointmentId}`).estado, 'en_cabina');
});

test('impide terminar con una ficha no confirmada para la cita', async () => {
  // Prepara una ficha revisada durante una cita anterior
  const firestore = buildFirestore({
    [`expedientesClinicos/${clientId}`]: {
      clientId,
      lastAppointmentId: 'appointment_previous',
      revision: 2,
      status: 'completed'
    }
  });

  await assert.rejects(runCompleteClinicalAttentionTransaction({
    actorUid: 'clinical_actor',
    firestore,
    request: { appointmentId, operationId: 'operation_completion_3' },
    serverTimestamp: () => 'timestamp'
  }), /Confirma la ficha/);
  assert.equal(firestore.get(`citas/${appointmentId}`).estado, 'en_cabina');
});
