import assert from 'node:assert/strict';
import test from 'node:test';
import {
  runAppointmentTransaction
} from '../src/AppointmentTransaction.js';
import {
  buildAppointmentSeed,
  buildCanonicalAppointmentRequest,
  FakeAppointmentFirestore
} from './AppointmentTransactionFixture.js';

// Define dependencias deterministas de documentos
const documentOptions = {
  serverTimestamp: () => 'SERVER_TIMESTAMP',
  toTimestamp: (date) => date.toISOString()
};

// Crea cliente cita cupo identidades y anticipo
test('crea una cita nueva de forma atómica', async () => {
  const firestore = new FakeAppointmentFirestore(buildAppointmentSeed());

  const result = await runAppointmentTransaction({
    actorUid: 'actor',
    firestore,
    request: buildCanonicalAppointmentRequest(),
    ...documentOptions
  });

  assert.equal(result.appointmentId, 'citas_1');
  assert.equal(result.clientId, 'clientes_1');
  assert.equal(result.depositAmountCents, 13_500);
  assert.equal(firestore.lastTransaction.creations.length, 6);

  const appointment = firestore.get('citas/citas_1');
  const payment = firestore.get('pagos/citas_1_anticipo');

  assert.equal(appointment.servicio, 'Limpieza facial profunda');
  assert.equal(appointment.estado, 'por_confirmar');
  assert.equal(appointment.contactoConfirmacion.canal, 'correo');
  assert.equal(
    appointment.contactoConfirmacion.solicitudEnviada,
    false
  );
  assert.equal(appointment.precioServicioCentavos, 45_000);
  assert.equal(appointment.anticipoMontoCentavos, 13_500);
  assert.equal(appointment.finBloque, '2026-08-04T19:00:00.000Z');
  assert.equal(payment.partes[1].referencia, 'SPEI-90871');
  assert.equal(payment.fecha, appointment.creadaEn);
});

// Reutiliza el propietario canónico de las identidades
test('reutiliza un cliente existente sin duplicarlo', async () => {
  const client = {
    id: null,
    fullName: 'María López',
    phone: '9811017687',
    email: 'maria@example.com'
  };
  const firestore = new FakeAppointmentFirestore(buildAppointmentSeed({
    'clientes/client-existing': {
      nombreCompleto: client.fullName,
      telefonoNormalizado: client.phone,
      emailNormalizado: client.email,
      fusionado: false
    },
    'identidadesClientes/telefono:9811017687': {
      clienteId: 'client-existing',
      tipo: 'telefono',
      valorNormalizado: client.phone
    },
    'identidadesClientes/correo:maria@example.com': {
      clienteId: 'client-existing',
      tipo: 'correo',
      valorNormalizado: client.email
    }
  }));

  const result = await runAppointmentTransaction({
    actorUid: 'actor',
    firestore,
    request: buildCanonicalAppointmentRequest({ client }),
    ...documentOptions
  });

  assert.equal(result.clientId, 'client-existing');
  assert.equal(firestore.lastTransaction.creations.length, 3);
  assert.equal(firestore.get('clientes/clientes_1'), undefined);
});

// Detiene cupos ya ocupados
test('rechaza un horario ocupado sin crear documentos', async () => {
  const firestore = new FakeAppointmentFirestore(buildAppointmentSeed({
    'cupos/2026-08-04_10:00': {
      citaId: 'otra-cita'
    }
  }));

  await assert.rejects(
    runAppointmentTransaction({
      actorUid: 'actor',
      firestore,
      request: buildCanonicalAppointmentRequest(),
      ...documentOptions
    }),
    /acaba de ser ocupado/
  );

  assert.equal(firestore.lastTransaction.creations.length, 0);
});

// Detiene horarios apartados desde el sitio publico
test('rechaza un horario con solicitud publica pendiente', async () => {
  const firestore = new FakeAppointmentFirestore(buildAppointmentSeed({
    'reservasPublicas/2026-08-04_10:00': {
      requestId: 'solicitud-publica'
    }
  }));

  await assert.rejects(
    runAppointmentTransaction({
      actorUid: 'actor',
      firestore,
      request: buildCanonicalAppointmentRequest(),
      ...documentOptions
    }),
    /acaba de ser ocupado/
  );

  assert.equal(firestore.lastTransaction.creations.length, 0);
});

// Detiene actores sin rol operativo
test('rechaza usuarios sin permisos de recepción', async () => {
  const firestore = new FakeAppointmentFirestore(buildAppointmentSeed({
    'usuarios/actor': {
      activo: true,
      rol: 'cosmetologa'
    }
  }));

  await assert.rejects(
    runAppointmentTransaction({
      actorUid: 'actor',
      firestore,
      request: buildCanonicalAppointmentRequest(),
      ...documentOptions
    }),
    /No tienes permisos/
  );

  assert.equal(firestore.lastTransaction.creations.length, 0);
});

// Detiene identidades pertenecientes a clientes diferentes
test('rechaza identidades que provocarían un cliente duplicado', async () => {
  const firestore = new FakeAppointmentFirestore(buildAppointmentSeed({
    'identidadesClientes/telefono:9811017687': {
      clienteId: 'client-phone',
      tipo: 'telefono',
      valorNormalizado: '9811017687'
    },
    'identidadesClientes/correo:maria@example.com': {
      clienteId: 'client-email',
      tipo: 'correo',
      valorNormalizado: 'maria@example.com'
    }
  }));

  await assert.rejects(
    runAppointmentTransaction({
      actorUid: 'actor',
      firestore,
      request: buildCanonicalAppointmentRequest(),
      ...documentOptions
    }),
    /pertenecen a clientes diferentes/
  );

  assert.equal(firestore.lastTransaction.creations.length, 0);
});
