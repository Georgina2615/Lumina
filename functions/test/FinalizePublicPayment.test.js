import assert from 'node:assert/strict';
import test from 'node:test';
import { finalizePublicPayment } from '../src/FinalizePublicPayment.js';
import {
  FakeAppointmentFirestore,
  buildAppointmentSeed
} from './AppointmentTransactionFixture.js';

const sessionId = 'payment_session_1';
const slotId = '2026-08-08_10:00';
const contactKey = 'a'.repeat(64);

// Construye una sesión pendiente con su bloqueo
const buildSeed = () => buildAppointmentSeed({
  [`sesionesPagoPublicas/${sessionId}`]: {
    schemaVersion: 1,
    status: 'pending_payment',
    sessionId,
    accessKeyHash: 'b'.repeat(64),
    contactKey,
    slotId,
    client: {
      fullName: 'María López',
      phone: '9811017687',
      email: 'maria@example.com'
    },
    service: {
      id: 'limpieza-profunda',
      name: 'Limpieza facial profunda',
      priceCents: 45_000,
      depositPercentage: 30,
      depositAmountCents: 13_500
    },
    schedule: {
      dateKey: '2026-08-08',
      time: '10:00',
      start: new Date('2026-08-08T16:00:00.000Z'),
      treatmentEnd: new Date('2026-08-08T18:30:00.000Z'),
      blockEnd: new Date('2026-08-08T19:00:00.000Z')
    }
  },
  [`reservasPublicas/${slotId}`]: {
    schemaVersion: 2,
    status: 'pending_payment',
    sessionId,
    dateKey: '2026-08-08',
    time: '10:00'
  },
  [`solicitudesCitaPublica/control/contactos/${contactKey}`]: {
    schemaVersion: 2,
    active: true,
    sessionId
  }
});

// Construye un pago aprobado del importe exacto
const buildPayment = (overrides = {}) => ({
  id: 123456789,
  status: 'approved',
  currency_id: 'MXN',
  transaction_amount: 135,
  payment_type_id: 'credit_card',
  external_reference: sessionId,
  card: { last_four_digits: '1234' },
  ...overrides
});

// Crea cita cliente cupo y pago una sola vez
test('convierte un pago aprobado en una cita completa', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed());
  const result = await finalizePublicPayment({
    firestore,
    payment: buildPayment(),
    sessionId
  });

  assert.equal(result.status, 'approved');
  assert.equal(firestore.get(`citas/${result.appointmentId}`).estado, 'por_confirmar');
  assert.equal(firestore.get(`cupos/${slotId}`).citaId, result.appointmentId);
  assert.equal(firestore.get(`pagos/${result.appointmentId}_anticipo`).montoCentavos, 13_500);
  assert.equal(firestore.get('pagosMercadoPago/123456789').appointmentId, result.appointmentId);
  assert.equal(firestore.get(`reservasPublicas/${slotId}`), undefined);
  assert.equal(
    firestore.get(`sesionesPagoPublicas/${sessionId}`).appointmentId,
    result.appointmentId
  );
});

// Repite el resultado sin crear otra cita
test('procesa de forma idempotente el mismo pago', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed());
  const first = await finalizePublicPayment({
    firestore,
    payment: buildPayment(),
    sessionId
  });
  const second = await finalizePublicPayment({
    firestore,
    payment: buildPayment(),
    sessionId
  });

  assert.equal(second.appointmentId, first.appointmentId);
  assert.equal(firestore.get('citas/citas_2'), undefined);
});

// Rechaza importes manipulados sin ocupar el horario
test('rechaza un pago con importe diferente', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed());

  await assert.rejects(() => finalizePublicPayment({
    firestore,
    payment: buildPayment({ transaction_amount: 100 }),
    sessionId
  }), /todavía no está aprobado/);
  assert.equal(firestore.get(`cupos/${slotId}`), undefined);
});
