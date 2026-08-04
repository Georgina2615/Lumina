import assert from 'node:assert/strict';
import test from 'node:test';
import {
  manageScheduleAvailabilityHandler
} from '../src/ManageScheduleAvailability.js';
import {
  runManageScheduleAvailabilityTransaction
} from '../src/ManageScheduleAvailabilityTransaction.js';
import {
  buildScheduleAvailabilityRequestHash,
  ScheduleAvailabilityError,
  validateScheduleAvailabilityRequest
} from '../src/ScheduleAvailabilityPolicy.js';
import {
  FakeAppointmentFirestore
} from './AppointmentTransactionFixture.js';

// Define el reloj estable de las pruebas
const now = new Date('2026-08-04T15:00:00.000Z');

// Define dependencias documentales deterministas
const documentOptions = {
  serverTimestamp: () => 'SERVER_TIMESTAMP',
  toTimestamp: (date) => date.toISOString()
};

// Construye una solicitud individual valida
const buildBlockRequest = (overrides = {}) => ({
  action: 'block_slot',
  dateKey: '2026-08-10',
  time: '10:00',
  reason: 'Mantenimiento de cabina',
  operationId: 'availability_123',
  ...overrides
});

// Construye la base administrativa
const buildSeed = (overrides = {}) => ({
  'usuarios/admin': {
    activo: true,
    rol: 'admin'
  },
  ...overrides
});

// Ejecuta una solicitud validada
const executeRequest = async ({
  data,
  firestore,
  actorUid = 'admin'
}) => {
  const request = validateScheduleAvailabilityRequest(data, now);

  return runManageScheduleAvailabilityTransaction({
    actorUid,
    firestore,
    request,
    requestHash: buildScheduleAvailabilityRequestHash(request),
    ...documentOptions
  });
};

test('normaliza un bloqueo y rechaza campos ajenos', () => {
  const request = validateScheduleAvailabilityRequest(
    buildBlockRequest({ reason: '  Cierre   preventivo  ' }),
    now
  );

  assert.equal(request.reason, 'Cierre preventivo');
  assert.equal(request.intervals[0].time, '10:00');
  assert.equal(buildScheduleAvailabilityRequestHash(request).length, 64);
  assert.equal(validateScheduleAvailabilityRequest(
    buildBlockRequest({ reason: '   ' }),
    now
  ).reason, null);
  assert.throws(
    () => validateScheduleAvailabilityRequest({
      ...buildBlockRequest(),
      actorUid: 'admin'
    }, now),
    (error) => error instanceof ScheduleAvailabilityError
      && error.code === 'invalid-argument'
  );
});

test('aplica los horarios canonicos y evita fechas no operativas', () => {
  const dailyRequest = validateScheduleAvailabilityRequest({
    action: 'block_day',
    dateKey: '2026-08-10',
    reason: 'Cierre del establecimiento',
    operationId: 'availability_day'
  }, now);

  assert.deepEqual(
    dailyRequest.intervals.map(({ time }) => time),
    ['10:00', '14:00', '17:00']
  );
  assert.throws(
    () => validateScheduleAvailabilityRequest(buildBlockRequest({
      dateKey: '2026-08-09'
    }), now),
    (error) => error instanceof ScheduleAvailabilityError
      && error.code === 'invalid-argument'
  );
  assert.throws(
    () => validateScheduleAvailabilityRequest(buildBlockRequest({
      time: '11:00'
    }), now),
    (error) => error instanceof ScheduleAvailabilityError
      && error.code === 'invalid-argument'
  );
});

test('crea un bloqueo atomico con historial', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed());
  const data = buildBlockRequest();
  delete data.reason;
  const result = await executeRequest({
    data,
    firestore
  });
  const slot = firestore.get('cupos/2026-08-10_10:00');
  const change = firestore.get(
    'cambiosDisponibilidad/availability_123'
  );

  assert.deepEqual(result.affectedSlotIds, ['2026-08-10_10:00']);
  assert.equal(slot.tipo, 'bloqueo_admin');
  assert.equal(slot.motivo, null);
  assert.equal(slot.duracionBloqueMinutos, 180);
  assert.equal(slot.inicio, '2026-08-10T16:00:00.000Z');
  assert.equal(change.actorUid, 'admin');
  assert.deepEqual(change.cuposAfectados, result.affectedSlotIds);
});

test('bloquea solo horarios libres y conserva cupos heredados', async () => {
  const legacyAppointment = {
    citaId: 'legacy_appointment',
    fecha: '2026-08-10',
    hora: '10:00'
  };
  const existingBlock = {
    tipo: 'bloqueo_admin',
    fecha: '2026-08-10',
    hora: '14:00',
    motivo: 'Ausencia'
  };
  const firestore = new FakeAppointmentFirestore(buildSeed({
    'cupos/2026-08-10_10:00': legacyAppointment,
    'cupos/2026-08-10_14:00': existingBlock
  }));
  const result = await executeRequest({
    data: {
      action: 'block_day',
      dateKey: '2026-08-10',
      reason: 'Cierre por mantenimiento',
      operationId: 'availability_day'
    },
    firestore
  });

  assert.deepEqual(result.affectedSlotIds, ['2026-08-10_17:00']);
  assert.deepEqual(
    firestore.get('cupos/2026-08-10_10:00'),
    legacyAppointment
  );
  assert.deepEqual(
    firestore.get('cupos/2026-08-10_14:00'),
    existingBlock
  );
  assert.equal(
    firestore.get('cupos/2026-08-10_17:00').tipo,
    'bloqueo_admin'
  );

  await assert.rejects(
    executeRequest({
      data: {
        action: 'block_day',
        dateKey: '2026-08-10',
        reason: '',
        operationId: 'availability_full_day'
      },
      firestore
    }),
    (error) => error instanceof ScheduleAvailabilityError
      && error.code === 'failed-precondition'
  );
  assert.equal(
    firestore.get('cambiosDisponibilidad/availability_full_day'),
    undefined
  );
});

test('reabre solo un bloqueo administrativo', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed({
    'cupos/2026-08-10_10:00': {
      tipo: 'bloqueo_admin',
      fecha: '2026-08-10',
      hora: '10:00',
      motivo: 'Ausencia programada'
    }
  }));
  const result = await executeRequest({
    data: {
      action: 'reopen_slot',
      dateKey: '2026-08-10',
      time: '10:00',
      operationId: 'availability_reopen'
    },
    firestore
  });
  const history = firestore.get(
    'cambiosDisponibilidad/availability_reopen'
  );

  assert.deepEqual(result.affectedSlotIds, ['2026-08-10_10:00']);
  assert.equal(firestore.get('cupos/2026-08-10_10:00'), undefined);
  assert.equal(history.motivo, 'Ausencia programada');
});

test('impide reabrir una cita heredada sin tipo', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed({
    'cupos/2026-08-10_10:00': {
      citaId: 'appointment_123',
      fecha: '2026-08-10',
      hora: '10:00'
    }
  }));

  await assert.rejects(
    executeRequest({
      data: {
        action: 'reopen_slot',
        dateKey: '2026-08-10',
        time: '10:00',
        operationId: 'availability_reopen'
      },
      firestore
    }),
    (error) => error instanceof ScheduleAvailabilityError
      && error.code === 'failed-precondition'
  );
  assert.equal(
    firestore.get('cupos/2026-08-10_10:00').citaId,
    'appointment_123'
  );
});

test('permite reintentos exactos y rechaza actores sin permisos', async () => {
  const firestore = new FakeAppointmentFirestore(buildSeed());
  const data = buildBlockRequest();

  await executeRequest({ data, firestore });
  const retry = await executeRequest({ data, firestore });

  assert.equal(retry.alreadyProcessed, true);
  assert.deepEqual(retry.affectedSlotIds, ['2026-08-10_10:00']);

  const unauthorizedFirestore = new FakeAppointmentFirestore(buildSeed({
    'usuarios/admin': {
      activo: true,
      rol: 'recepcion'
    }
  }));

  await assert.rejects(
    executeRequest({ data, firestore: unauthorizedFirestore }),
    (error) => error instanceof ScheduleAvailabilityError
      && error.code === 'permission-denied'
  );
});

test('exige autenticacion antes de ejecutar la callable', async () => {
  await assert.rejects(
    manageScheduleAvailabilityHandler({
      auth: null,
      data: buildBlockRequest(),
      firestore: new FakeAppointmentFirestore(buildSeed()),
      now
    }),
    (error) => error.code === 'unauthenticated'
  );
});
