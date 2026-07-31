import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase-admin/firestore';
import {
  validateManagementRequest
} from '../src/AppointmentManagementPolicy.js';
import {
  requireManagedAppointment
} from '../src/AppointmentManagementStatePolicy.js';
import {
  buildManagementAppointment,
  buildManagementFirestore,
  manageAppointment,
  managementIds
} from './AppointmentManagementFixture.js';

// Rechaza esquemas incompatibles con el cobro
test('rechaza una cita con esquema heredado', async () => {
  const firestore = buildManagementFirestore('por_confirmar', {
    appointmentOverrides: { schemaVersion: 2 }
  });

  await assert.rejects(
    manageAppointment({
      action: 'confirmar',
      channel: 'llamada',
      firestore
    }),
    /actualizar su formato/
  );
});

// Exige la identidad canónica del cliente
test('rechaza una cita sin cliente válido', async () => {
  const firestore = buildManagementFirestore('por_confirmar', {
    appointmentOverrides: { clienteId: '' }
  });

  await assert.rejects(
    manageAppointment({
      action: 'confirmar',
      channel: 'llamada',
      firestore
    }),
    /cliente válido/
  );
});

// Protege la ventana de entrada a cabina
test('permite cabina únicamente desde treinta minutos antes', async () => {
  const earlyFirestore = buildManagementFirestore('confirmada');

  await assert.rejects(
    manageAppointment({
      action: 'enviar_cabina',
      now: new Date('2026-08-04T15:29:59.000Z'),
      firestore: earlyFirestore
    }),
    /treinta minutos/
  );

  const allowedFirestore = buildManagementFirestore('confirmada');
  await manageAppointment({
    action: 'enviar_cabina',
    now: new Date('2026-08-04T15:30:00.000Z'),
    firestore: allowedFirestore
  });

  assert.equal(
    allowedFirestore.get(`citas/${managementIds.appointmentId}`).estado,
    'en_cabina'
  );
});

// Evita pasar al cobro antes del inicio
test('permite cobro únicamente desde el inicio', async () => {
  const earlyFirestore = buildManagementFirestore('en_cabina');

  await assert.rejects(
    manageAppointment({
      action: 'enviar_cobro',
      now: new Date('2026-08-04T15:59:59.000Z'),
      firestore: earlyFirestore
    }),
    /antes de iniciar/
  );

  const allowedFirestore = buildManagementFirestore('en_cabina');
  await manageAppointment({
    action: 'enviar_cobro',
    now: new Date('2026-08-04T16:00:00.000Z'),
    firestore: allowedFirestore
  });

  assert.equal(
    allowedFirestore.get(`citas/${managementIds.appointmentId}`).estado,
    'por_cobrar'
  );
});

// Clasifica ausencias después de la tolerancia
test('rechaza cancelacion del cliente después de la tolerancia', async () => {
  const firestore = buildManagementFirestore('confirmada');

  await assert.rejects(
    manageAppointment({
      action: 'cancelar',
      origin: 'cliente',
      reason: 'La clienta solicitó cancelar',
      now: new Date('2026-08-04T16:15:00.000Z'),
      firestore
    }),
    /Registra una inasistencia/
  );
});

// Conserva cancelaciones urgentes de la clinica
test('permite cancelacion de clinica después de la tolerancia', async () => {
  const firestore = buildManagementFirestore('confirmada');

  await manageAppointment({
    action: 'cancelar',
    origin: 'clinica',
    reason: 'La clínica presentó una emergencia',
    now: new Date('2026-08-04T16:15:00.000Z'),
    firestore
  });

  const appointment = firestore.get(
    `citas/${managementIds.appointmentId}`
  );
  assert.equal(appointment.estado, 'cancelada');
  assert.equal(
    appointment.cancelacion.anticipoResultado,
    'disponible_reprogramacion'
  );
});

// Exige el correo actual del cliente
test('rechaza confirmar por correo sin correo vigente', async () => {
  const firestore = buildManagementFirestore('por_confirmar', {
    clientOverrides: { emailNormalizado: '' }
  });

  await assert.rejects(
    manageAppointment({
      action: 'confirmar',
      channel: 'correo',
      firestore
    }),
    /correo válido/
  );
});

// Confirma por correo con el cliente vigente
test('acepta confirmar por correo con direccion vigente', async () => {
  const firestore = buildManagementFirestore();

  await manageAppointment({
    action: 'confirmar',
    channel: 'correo',
    firestore
  });

  assert.equal(
    firestore.get(`citas/${managementIds.appointmentId}`)
      .confirmacion.canal,
    'correo'
  );
});

// Reintenta una cancelacion sin exigir el cupo eliminado
test('reintenta exactamente una cancelacion confirmada', async () => {
  const firestore = buildManagementFirestore();
  const request = {
    action: 'cancelar',
    origin: 'cliente',
    reason: 'La clienta solicitó cancelar',
    firestore
  };

  const first = await manageAppointment(request);
  const second = await manageAppointment(request);

  assert.deepEqual(second, first);
  assert.equal(
    firestore.get(`cupos/${managementIds.slotId}`),
    undefined
  );
});

// Reintenta una inasistencia sin exigir el cupo eliminado
test('reintenta exactamente una inasistencia confirmada', async () => {
  const firestore = buildManagementFirestore('confirmada');
  const request = {
    action: 'marcar_no_asistio',
    reason: 'La clienta no llegó',
    now: new Date('2026-08-04T16:15:00.000Z'),
    firestore
  };

  const first = await manageAppointment(request);
  const second = await manageAppointment(request);

  assert.deepEqual(second, first);
});

// Rechaza reintentos con metadatos diferentes
test('rechaza un reintento que cambia el motivo', async () => {
  const firestore = buildManagementFirestore();

  await manageAppointment({
    action: 'cancelar',
    origin: 'cliente',
    reason: 'La clienta solicitó cancelar',
    firestore
  });

  await assert.rejects(
    manageAppointment({
      action: 'cancelar',
      origin: 'cliente',
      reason: 'La clienta cambió el motivo',
      firestore
    }),
    /ya fue actualizada/
  );
});

// Rechaza reintentos realizados por otro actor
test('rechaza un reintento realizado por otro actor', async () => {
  const firestore = buildManagementFirestore();

  await manageAppointment({
    action: 'cancelar',
    origin: 'cliente',
    reason: 'La clienta solicitó cancelar',
    firestore
  });

  firestore.documents.set('usuarios/actor-secundario', {
    activo: true,
    rol: 'recepcion'
  });

  await assert.rejects(
    manageAppointment({
      action: 'cancelar',
      actorUid: 'actor-secundario',
      origin: 'cliente',
      reason: 'La clienta solicitó cancelar',
      firestore
    }),
    /ya fue actualizada/
  );
});

// Verifica marcas temporales reales
test('acepta Timestamp real al validar la tolerancia', () => {
  const request = validateManagementRequest({
    appointmentId: managementIds.appointmentId,
    action: 'marcar_no_asistio',
    reason: 'La clienta no llegó'
  });
  const snapshot = {
    exists: true,
    data: () => buildManagementAppointment('confirmada', {
      inicio: Timestamp.fromDate(
        new Date('2026-08-04T16:00:00.000Z')
      )
    })
  };

  const result = requireManagedAppointment({
    now: new Date('2026-08-04T16:15:00.000Z'),
    request,
    snapshot
  });

  assert.equal(result.isRetry, false);
});

// Rechaza contratos incompletos
test('exige origen y motivo al cancelar', () => {
  assert.throws(
    () => validateManagementRequest({
      appointmentId: managementIds.appointmentId,
      action: 'cancelar'
    }),
    /origen/
  );
});
