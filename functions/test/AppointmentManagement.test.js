import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildManagementFirestore as buildFirestore,
  manageAppointment as manage,
  managementIds
} from './AppointmentManagementFixture.js';

// Conserva identidades cortas para las verificaciones
const {
  appointmentId,
  slotId
} = managementIds;

// Recorre el flujo de recepción hasta cabina
test('confirma y envia a cabina sin liberar el cupo', async () => {
  const firestore = buildFirestore();

  await manage({
    action: 'confirmar',
    channel: 'llamada',
    firestore
  });

  const confirmed = firestore.get(`citas/${appointmentId}`);
  assert.equal(confirmed.estado, 'confirmada');
  assert.equal(confirmed.confirmacion.canal, 'llamada');
  assert.equal(confirmed.contactoConfirmacion.requiereLlamada, false);
  assert.equal(firestore.get(`cupos/${slotId}`).citaId, appointmentId);

  await manage({
    action: 'enviar_cabina',
    now: new Date('2026-08-04T15:30:00.000Z'),
    firestore
  });
  assert.equal(
    firestore.get(`citas/${appointmentId}`).estado,
    'en_cabina'
  );
  assert.equal(firestore.get(`cupos/${slotId}`).citaId, appointmentId);
});

// Retiene el anticipo cuando cancela el cliente
test('cancela por cliente y libera el cupo', async () => {
  const firestore = buildFirestore();

  const result = await manage({
    action: 'cancelar',
    origin: 'cliente',
    reason: 'La clienta solicitó cancelar',
    firestore
  });

  const appointment = firestore.get(`citas/${appointmentId}`);
  assert.deepEqual(result, {
    appointmentId,
    status: 'cancelada'
  });
  assert.equal(appointment.cancelacion.anticipoResultado, 'retenido');
  assert.equal(
    appointment.cancelacion.reprogramacionDisponible,
    false
  );
  assert.equal(firestore.get(`cupos/${slotId}`), undefined);
});

// Habilita el anticipo cuando cancela la clinica
test('cancela por clinica y habilita reprogramacion', async () => {
  const firestore = buildFirestore('confirmada');

  await manage({
    action: 'cancelar',
    origin: 'clinica',
    reason: 'La clínica no puede prestar el servicio',
    firestore
  });

  const appointment = firestore.get(`citas/${appointmentId}`);
  assert.equal(
    appointment.cancelacion.anticipoResultado,
    'disponible_reprogramacion'
  );
  assert.equal(
    appointment.reprogramacion.anticipoDisponibleCentavos,
    13_500
  );
  assert.equal(firestore.get(`cupos/${slotId}`), undefined);
});

// Protege la tolerancia antes de la inasistencia
test('rechaza inasistencia antes de quince minutos', async () => {
  const firestore = buildFirestore('confirmada');

  await assert.rejects(
    manage({
      action: 'marcar_no_asistio',
      reason: 'La clienta no llegó',
      now: new Date('2026-08-04T16:14:59.000Z'),
      firestore
    }),
    /Espera quince minutos/
  );

  assert.equal(
    firestore.get(`citas/${appointmentId}`).estado,
    'confirmada'
  );
  assert.equal(firestore.get(`cupos/${slotId}`).citaId, appointmentId);
});

// Registra la inasistencia al cumplir la tolerancia
test('registra inasistencia y conserva el anticipo', async () => {
  const firestore = buildFirestore('confirmada');

  await manage({
    action: 'marcar_no_asistio',
    reason: 'La clienta no llegó',
    now: new Date('2026-08-04T16:15:00.000Z'),
    firestore
  });

  const appointment = firestore.get(`citas/${appointmentId}`);
  assert.equal(appointment.estado, 'no_asistio');
  assert.equal(appointment.inasistencia.toleranciaMinutos, 15);
  assert.equal(appointment.inasistencia.anticipoResultado, 'retenido');
  assert.equal(firestore.get(`cupos/${slotId}`), undefined);
});

// Rechaza saltos que rompen el flujo
test('rechaza enviar una cita pendiente directo a cabina', async () => {
  const firestore = buildFirestore();

  await assert.rejects(
    manage({
      action: 'enviar_cabina',
      firestore
    }),
    /ya no permite/
  );
});

// Rechaza actores fuera de recepcion
test('rechaza actores sin rol operativo', async () => {
  const firestore = buildFirestore();
  firestore.documents.set('usuarios/actor', {
    activo: true,
    rol: 'cosmetologa'
  });

  await assert.rejects(
    manage({
      action: 'confirmar',
      channel: 'presencial',
      firestore
    }),
    /No tienes permisos/
  );
});

// Rechaza contratos incompletos
