import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMercadoPagoDeposit,
  hashPublicPaymentAccessKey,
  requirePublicPaymentAccess,
  validatePublicPaymentRequest
} from '../src/PublicPaymentPolicy.js';

const now = new Date('2030-07-01T12:00:00.000Z');

// Construye una solicitud segura de pago
const buildRequest = (overrides = {}) => ({
  client: {
    fullName: 'María López',
    phone: '9811017687',
    email: 'MARIA@example.com'
  },
  serviceId: 'limpieza-facial-profunda',
  dateKey: '2030-07-01',
  time: '10:00',
  privacyAccepted: true,
  termsAccepted: true,
  cancellationAccepted: true,
  returnOrigin: 'https://lumina-f247c.web.app',
  ...overrides
});

// Normaliza una solicitud sin aceptar importes del navegador
test('normaliza los datos previos al pago publico', () => {
  const result = validatePublicPaymentRequest(buildRequest(), now);

  assert.equal(result.client.email, 'maria@example.com');
  assert.equal(result.serviceId, 'limpieza-facial-profunda');
  assert.equal(result.slotId, '2030-07-01_10:00');
  assert.equal(result.interval.start.toISOString(), '2030-07-01T16:00:00.000Z');
});

// Rechaza direcciones externas y autorizaciones incompletas
test('protege el regreso y los documentos informativos', () => {
  assert.throws(() => validatePublicPaymentRequest(buildRequest({
    returnOrigin: 'https://sitio-ajeno.example'
  }), now), /regreso al sitio/);
  assert.throws(() => validatePublicPaymentRequest(buildRequest({
    privacyAccepted: false
  }), now), /Acepta los documentos/);
});

// Conserva una llave mediante su huella privada
test('protege el acceso a la sesion de pago', () => {
  const storedHash = hashPublicPaymentAccessKey('llave-segura');

  assert.doesNotThrow(() => requirePublicPaymentAccess({
    accessKey: 'llave-segura',
    storedHash
  }));
  assert.throws(() => requirePublicPaymentAccess({
    accessKey: 'otra-llave',
    storedHash
  }), /consulta del pago/);
});

// Traduce tarjetas sin cambiar el importe real
test('convierte un pago aprobado en anticipo interno', () => {
  const deposit = buildMercadoPagoDeposit({
    payment: {
      id: 123456,
      status: 'approved',
      currency_id: 'MXN',
      transaction_amount: 135,
      payment_type_id: 'credit_card',
      card: { last_four_digits: '1234' }
    },
    requiredCents: 13500
  });

  assert.equal(deposit.method, 'tarjeta');
  assert.equal(deposit.amountCents, 13500);
  assert.equal(deposit.payments[0].cardLastFour, '1234');
});

// Impide aceptar importes o monedas diferentes
test('rechaza un pago que no coincide con el anticipo', () => {
  assert.throws(() => buildMercadoPagoDeposit({
    payment: {
      id: 123456,
      status: 'approved',
      currency_id: 'USD',
      transaction_amount: 135,
      payment_type_id: 'account_money'
    },
    requiredCents: 13500
  }), /todavía no está aprobado/);
});
