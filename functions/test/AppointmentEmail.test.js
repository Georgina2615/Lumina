import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAppointmentEmailParameters
} from '../src/AppointmentEmailTemplate.js';
import {
  sendAppointmentEmailHandler
} from '../src/SendAppointmentEmail.js';
import { EmailJsTransportError } from '../src/EmailJsTransport.js';
import {
  attemptDate,
  createTicketFirestore
} from './SaleTicketTestFixture.js';

const appointmentId = 'appointment_AB12CD34';
const attemptId = 'event_appointment_email';

// Construye una cita válida para correo
const buildAppointment = (overrides = {}) => ({
  schemaVersion: 3,
  estado: 'por_confirmar',
  clienteId: 'client_1',
  nombreCompleto: 'María López',
  servicio: 'Limpieza facial profunda',
  inicio: new Date('2026-08-08T16:00:00.000Z'),
  anticipoMontoCentavos: 13_500,
  ...overrides
});

// Construye un cliente válido para correo
const buildClient = (overrides = {}) => ({
  nombreCompleto: 'María López',
  email: 'maria@example.com',
  emailNormalizado: 'maria@example.com',
  ...overrides
});

// Construye el entorno transaccional del correo
const buildEnvironment = ({ appointment, client } = {}) => (
  createTicketFirestore({
    [`citas/${appointmentId}`]: appointment ?? buildAppointment(),
    'clientes/client_1': client ?? buildClient()
  })
);

test('construye las variables localizadas de una cita', () => {
  const parameters = buildAppointmentEmailParameters({
    appointment: buildAppointment(),
    appointmentId,
    client: buildClient()
  });

  assert.equal(parameters.to_email, 'maria@example.com');
  assert.equal(parameters.client_name, 'María López');
  assert.equal(parameters.service_name, 'Limpieza facial profunda');
  assert.equal(parameters.appointment_date, '8 de agosto de 2026');
  assert.equal(parameters.appointment_time, '10:00 a.m.');
  assert.equal(parameters.deposit, '$135.00');
  assert.equal(parameters.appointment_folio, 'LS-CITA-AB12CD34');
});

test('envía una cita una sola vez y conserva el resultado', async () => {
  const { firestore, read } = buildEnvironment();
  let calls = 0;
  const sendEmail = async () => {
    calls += 1;
    return { accepted: true };
  };

  const firstResult = await sendAppointmentEmailHandler({
    appointmentId,
    attemptId,
    firestore,
    sendEmail,
    serverTimestamp: () => attemptDate
  });
  const repeatedResult = await sendAppointmentEmailHandler({
    appointmentId,
    attemptId,
    firestore,
    sendEmail,
    serverTimestamp: () => attemptDate
  });

  assert.equal(firstResult.status, 'enviado');
  assert.equal(repeatedResult.status, 'enviado');
  assert.equal(calls, 1);
  assert.equal(
    read(`citas/${appointmentId}`).notificacionRegistro.estado,
    'enviado'
  );
});

test('omite el correo ausente sin afectar la cita', async () => {
  const { firestore, read } = buildEnvironment({
    client: buildClient({ email: '', emailNormalizado: '' })
  });
  let calls = 0;
  const result = await sendAppointmentEmailHandler({
    appointmentId,
    attemptId,
    firestore,
    sendEmail: async () => {
      calls += 1;
    },
    serverTimestamp: () => attemptDate
  });

  assert.equal(result.status, 'omitido');
  assert.equal(calls, 0);
  assert.equal(
    read(`citas/${appointmentId}`).notificacionRegistro.estado,
    'omitido'
  );
});

test('registra un rechazo seguro de EmailJS', async () => {
  const { firestore, read } = buildEnvironment();
  const result = await sendAppointmentEmailHandler({
    appointmentId,
    attemptId,
    firestore,
    sendEmail: async () => {
      throw new EmailJsTransportError(
        'authorization',
        'Respuesta privada del proveedor'
      );
    },
    serverTimestamp: () => attemptDate
  });

  const notification = read(`citas/${appointmentId}`)
    .notificacionRegistro;
  assert.equal(result.status, 'fallido');
  assert.equal(notification.estado, 'fallido');
  assert.equal(
    notification.ultimoError,
    'Revisa la autorización del servicio de correo'
  );
  assert.equal(notification.ultimoError.includes('privada'), false);
});

test('no repite un envío cuyo cierre es incierto', async () => {
  const { firestore, read } = buildEnvironment({
    appointment: buildAppointment({
      notificacionRegistro: {
        estado: 'enviando',
        intentoId: attemptId,
        intentos: 1
      }
    })
  });
  let calls = 0;
  const result = await sendAppointmentEmailHandler({
    appointmentId,
    attemptId,
    firestore,
    sendEmail: async () => {
      calls += 1;
    },
    serverTimestamp: () => attemptDate
  });

  assert.equal(result.status, 'no_confirmado');
  assert.equal(calls, 0);
  assert.equal(
    read(`citas/${appointmentId}`).notificacionRegistro.estado,
    'no_confirmado'
  );
});
