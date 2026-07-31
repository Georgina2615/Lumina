import assert from 'node:assert/strict';
import test from 'node:test';
import {
  requireExpectedDeposit
} from '../src/AppointmentDepositPolicy.js';
import {
  validateAppointmentRequest
} from '../src/AppointmentRequestPolicy.js';

// Define un reloj anterior a la cita
const now = new Date('2026-08-03T16:00:00.000Z');

// Construye una solicitud válida
const buildRequest = (overrides = {}) => ({
  client: {
    fullName: 'María López',
    phone: '9811017687',
    email: 'MARIA@example.com'
  },
  serviceId: 'limpieza-profunda',
  dateKey: '2026-08-04',
  time: '10:00',
  deposit: {
    method: 'efectivo',
    payments: [{
      method: 'efectivo',
      amountCents: 13_500,
      cashReceivedCents: 15_000,
      changeCents: 1_500,
      reference: '',
      cardLastFour: ''
    }]
  },
  ...overrides
});

// Confirma la normalización completa
test('normaliza una solicitud presencial válida', () => {
  const request = validateAppointmentRequest(buildRequest(), now);

  assert.equal(request.client.fullName, 'María López');
  assert.equal(request.client.phone, '9811017687');
  assert.equal(request.client.email, 'maria@example.com');
  assert.equal(request.interval.start.toISOString(), '2026-08-04T16:00:00.000Z');
  assert.equal(request.interval.treatmentEnd.toISOString(), '2026-08-04T18:30:00.000Z');
  assert.equal(request.interval.blockEnd.toISOString(), '2026-08-04T19:00:00.000Z');
  assert.equal(request.deposit.payments[0].changeCents, 1_500);
});

// Rechaza nombres con números
test('rechaza nombres que contienen números', () => {
  assert.throws(
    () => validateAppointmentRequest(buildRequest({
      client: {
        fullName: 'Cliente 211',
        phone: '9811017687',
        email: ''
      }
    }), now),
    /El nombre solo puede contener letras/
  );
});

// Rechaza reservas dominicales
test('rechaza citas en domingo', () => {
  assert.throws(
    () => validateAppointmentRequest(buildRequest({
      dateKey: '2026-08-02'
    }), now),
    /domingo/
  );
});

// Rechaza reservas sin anticipación
test('exige quince minutos de anticipación', () => {
  const lateNow = new Date('2026-08-04T15:50:01.000Z');

  assert.throws(
    () => validateAppointmentRequest(buildRequest(), lateNow),
    /quince minutos/
  );
});

// Exige autorización de terminal
test('exige referencia para pagos con tarjeta', () => {
  assert.throws(
    () => validateAppointmentRequest(buildRequest({
      deposit: {
        method: 'tarjeta',
        payments: [{
          method: 'tarjeta',
          amountCents: 13_500,
          cashReceivedCents: 0,
          changeCents: 0,
          reference: '',
          cardLastFour: '1234'
        }]
      }
    }), now),
    /folio o autorización/
  );
});

// Permite terminación opcional de tarjeta
test('acepta tarjeta con referencia y terminación opcional', () => {
  const request = validateAppointmentRequest(buildRequest({
    deposit: {
      method: 'tarjeta',
      payments: [{
        method: 'tarjeta',
        amountCents: 13_500,
        cashReceivedCents: 0,
        changeCents: 0,
        reference: 'AUT-45873',
        cardLastFour: ''
      }]
    }
  }), now);

  assert.equal(request.deposit.payments[0].reference, 'AUT-45873');
  assert.equal(request.deposit.payments[0].cardLastFour, '');
});

// Verifica la suma del anticipo
test('consolida un anticipo mixto del treinta por ciento', () => {
  const request = validateAppointmentRequest(buildRequest({
    deposit: {
      method: 'mixto',
      payments: [
        {
          method: 'efectivo',
          amountCents: 3_500,
          cashReceivedCents: 3_500,
          changeCents: 0,
          reference: '',
          cardLastFour: ''
        },
        {
          method: 'transferencia',
          amountCents: 10_000,
          cashReceivedCents: 0,
          changeCents: 0,
          reference: 'SPEI-90871',
          cardLastFour: ''
        }
      ]
    }
  }), now);

  const deposit = requireExpectedDeposit({
    deposit: request.deposit,
    priceCents: 45_000,
    percentage: 30
  });

  assert.equal(deposit.amountCents, 13_500);
  assert.equal(deposit.payments[0].changeCents, 0);
});

// Rechaza importes distintos al precio real
test('rechaza pagos que no suman el anticipo canónico', () => {
  const request = validateAppointmentRequest(buildRequest(), now);

  assert.throws(
    () => requireExpectedDeposit({
      deposit: request.deposit,
      priceCents: 50_000,
      percentage: 30
    }),
    /no suman/
  );
});
