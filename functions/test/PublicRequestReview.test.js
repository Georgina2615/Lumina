import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runPublicRequestReviewTransaction
} from '../src/PublicRequestReviewTransaction.js';
import {
  validatePublicRequestReview
} from '../src/PublicRequestReviewPolicy.js';
import {
  FakeAppointmentFirestore,
  buildAppointmentSeed
} from './AppointmentTransactionFixture.js';

const now = new Date('2026-08-06T12:00:00.000Z');
const requestId = 'public_request_1';
const contactKey = 'a'.repeat(64);
const slotId = '2026-08-08_10:00';

// Construye una solicitud pública persistida
const buildPublicRequest = () => ({
  schemaVersion: 1,
  status: 'pending_review',
  requestId,
  contactKey,
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
  },
  proof: {
    path: `comprobantes-anticipos-publicos/${requestId}/comprobante.webp`,
    contentType: 'image/webp',
    paymentReference: 'LS-WEB-A1B2C3D4'
  },
  createdAt: now,
  updatedAt: now
});

// Construye los documentos mínimos de revisión
const buildReviewSeed = () => buildAppointmentSeed({
  [`solicitudesCitaPublica/${requestId}`]: buildPublicRequest(),
  [`reservasPublicas/${slotId}`]: {
    schemaVersion: 1,
    status: 'pending_review',
    requestId,
    dateKey: '2026-08-08',
    time: '10:00'
  },
  [`solicitudesCitaPublica/control/contactos/${contactKey}`]: {
    schemaVersion: 1,
    active: true,
    requestId
  }
});

test('valida aprobaciones y rechazos con motivo', () => {
  assert.deepEqual(validatePublicRequestReview({
    requestId,
    action: 'approve'
  }), {
    requestId,
    action: 'approve',
    reason: ''
  });
  assert.throws(
    () => validatePublicRequestReview({
      requestId,
      action: 'reject',
      reason: ' '
    }),
    /Escribe el motivo/
  );
});

test('aprueba una solicitud y crea cita cliente pago y cupo', async () => {
  const firestore = new FakeAppointmentFirestore(buildReviewSeed());
  const result = await runPublicRequestReviewTransaction({
    actorUid: 'actor',
    command: { requestId, action: 'approve', reason: '' },
    firestore,
    now
  });

  assert.equal(result.status, 'approved');
  assert.equal(firestore.get(`solicitudesCitaPublica/${requestId}`).status, 'approved');
  assert.equal(firestore.get(`reservasPublicas/${slotId}`), undefined);
  assert.equal(firestore.get(`cupos/${slotId}`).citaId, result.appointmentId);
  assert.equal(firestore.get(`citas/${result.appointmentId}`).estado, 'por_confirmar');
  assert.equal(firestore.get(`pagos/${result.appointmentId}_anticipo`).montoCentavos, 13_500);
  assert.equal(firestore.get(`identidadesClientes/telefono:9811017687`).clienteId, result.clientId);
  assert.equal(firestore.get(`identidadesClientes/correo:maria@example.com`).clienteId, result.clientId);
});

test('rechaza una solicitud libera el horario y conserva el registro', async () => {
  const firestore = new FakeAppointmentFirestore(buildReviewSeed());
  const result = await runPublicRequestReviewTransaction({
    actorUid: 'actor',
    command: {
      requestId,
      action: 'reject',
      reason: 'El importe no coincide'
    },
    firestore,
    now
  });

  assert.equal(result.status, 'rejected');
  assert.equal(firestore.get(`solicitudesCitaPublica/${requestId}`).status, 'rejected');
  assert.equal(firestore.get(`reservasPublicas/${slotId}`), undefined);
  assert.equal(firestore.get(`cupos/${slotId}`), undefined);
});

test('una solicitud aprobada no crea otra cita', async () => {
  const seed = buildReviewSeed();
  seed[`solicitudesCitaPublica/${requestId}`] = {
    ...seed[`solicitudesCitaPublica/${requestId}`],
    status: 'approved',
    appointmentId: 'appointment_existing',
    clientId: 'client_existing'
  };
  const firestore = new FakeAppointmentFirestore(seed);
  const result = await runPublicRequestReviewTransaction({
    actorUid: 'actor',
    command: { requestId, action: 'approve', reason: '' },
    firestore,
    now
  });

  assert.equal(result.alreadyProcessed, true);
  assert.equal(result.appointmentId, 'appointment_existing');
  assert.equal(firestore.get('citas/citas_1'), undefined);
});

test('reutiliza el cliente oficial aunque el nombre público cambie', async () => {
  const seed = buildReviewSeed();
  seed['clientes/client_existing'] = {
    nombreCompleto: 'María Elena López',
    telefono: '9811017687',
    telefonoNormalizado: '9811017687',
    email: 'maria@example.com',
    emailNormalizado: 'maria@example.com',
    fusionado: false
  };
  seed['identidadesClientes/telefono:9811017687'] = {
    tipo: 'telefono',
    valorNormalizado: '9811017687',
    clienteId: 'client_existing'
  };
  seed['identidadesClientes/correo:maria@example.com'] = {
    tipo: 'correo',
    valorNormalizado: 'maria@example.com',
    clienteId: 'client_existing'
  };
  const firestore = new FakeAppointmentFirestore(seed);
  const result = await runPublicRequestReviewTransaction({
    actorUid: 'actor',
    command: { requestId, action: 'approve', reason: '' },
    firestore,
    now
  });

  assert.equal(result.clientId, 'client_existing');
  assert.equal(
    firestore.get(`citas/${result.appointmentId}`).nombreCompleto,
    'María Elena López'
  );
  assert.equal(firestore.get('clientes/clientes_1'), undefined);
});
