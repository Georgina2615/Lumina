import assert from 'node:assert/strict';
import test from 'node:test';
import { SaleError } from '../src/SaleError.js';
import { validateSaleRequest } from '../src/SalePolicy.js';
import {
  buildDepositPaymentId,
  buildRequestHash,
  buildSaleIdentifiers
} from '../src/SaleIdentifiers.js';

// Define una clave válida reutilizable
const validKey = '12345678-abcd-4321-abcd-123456789012';

test('normaliza un cobro en efectivo', () => {
  // Normaliza una solicitud válida
  const request = validateSaleRequest({
    appointmentId: 'appointment_1',
    idempotencyKey: validKey,
    productItems: [],
    payments: [{
      method: 'efectivo',
      amountCents: 31_500,
      cashReceivedCents: 32_000
    }]
  });

  assert.deepEqual(request.payments[0], {
    method: 'efectivo',
    amountCents: 31_500,
    cashReceivedCents: 32_000,
    changeCents: 500,
    reference: '',
    cardLastFour: ''
  });
});

test('acepta exactamente dos métodos diferentes', () => {
  // Normaliza un pago mixto válido
  const request = validateSaleRequest({
    appointmentId: 'appointment_1',
    idempotencyKey: validKey,
    payments: [
      {
        method: 'efectivo',
        amountCents: 10_000,
        cashReceivedCents: 10_000
      },
      {
        method: 'transferencia',
        amountCents: 21_500,
        reference: 'SPEI123'
      }
    ]
  });

  assert.deepEqual(
    request.payments.map(({ method }) => method),
    ['efectivo', 'transferencia']
  );
});

test('exige referencia para transferencia', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: 'appointment_1',
      idempotencyKey: validKey,
      payments: [{
        method: 'transferencia',
        amountCents: 31_500
      }]
    }),
    (error) => error instanceof SaleError
  );
});

test('rechaza métodos repetidos en pago mixto', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: 'appointment_1',
      idempotencyKey: validKey,
      payments: [
        {
          method: 'efectivo',
          amountCents: 10_000,
          cashReceivedCents: 10_000
        },
        {
          method: 'efectivo',
          amountCents: 21_500,
          cashReceivedCents: 21_500
        }
      ]
    }),
    (error) => error instanceof SaleError
  );
});

test('rechaza venta de mostrador sin productos', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: null,
      idempotencyKey: validKey,
      payments: [{
        method: 'tarjeta',
        amountCents: 10_000
      }],
      productItems: []
    }),
    (error) => error instanceof SaleError
  );
});

test('rechaza productos duplicados', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: null,
      idempotencyKey: validKey,
      payments: [{
        method: 'tarjeta',
        amountCents: 10_000
      }],
      productItems: [
        { productId: 'product_1', quantity: 1 },
        { productId: 'product_1', quantity: 1 }
      ]
    }),
    (error) => error instanceof SaleError
  );
});

test('normaliza el correo opcional de mostrador', () => {
  // Normaliza una venta con destinatario temporal
  const request = validateSaleRequest({
    appointmentId: null,
    idempotencyKey: validKey,
    payments: [{
      method: 'tarjeta',
      amountCents: 10_000
    }],
    productItems: [{ productId: 'product_1', quantity: 1 }],
    receiptEmail: '  CLIENTE@Example.COM '
  });

  assert.equal(request.receiptEmail, 'cliente@example.com');
});

test('rechaza un correo de comprobante incompleto', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: null,
      idempotencyKey: validKey,
      payments: [{
        method: 'tarjeta',
        amountCents: 10_000
      }],
      productItems: [{ productId: 'product_1', quantity: 1 }],
      receiptEmail: 'correo-incompleto'
    }),
    (error) => error instanceof SaleError
  );
});

test('impide reemplazar el correo canónico de una cita', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: 'appointment_1',
      idempotencyKey: validKey,
      payments: [{
        method: 'tarjeta',
        amountCents: 31_500
      }],
      receiptEmail: 'otro@example.com'
    }),
    (error) => error instanceof SaleError
  );
});

test('impide reemplazar el correo de un cliente conocido', () => {
  assert.throws(
    () => validateSaleRequest({
      appointmentId: null,
      clientId: 'client_1',
      idempotencyKey: validKey,
      payments: [{
        method: 'tarjeta',
        amountCents: 10_000
      }],
      productItems: [{ productId: 'product_1', quantity: 1 }],
      receiptEmail: 'otro@example.com'
    }),
    (error) => error instanceof SaleError
  );
});

test('incluye el correo de mostrador en la idempotencia', () => {
  // Construye la solicitud base
  const baseData = {
    appointmentId: null,
    idempotencyKey: validKey,
    payments: [{
      method: 'tarjeta',
      amountCents: 10_000
    }],
    productItems: [{ productId: 'product_1', quantity: 1 }]
  };

  // Normaliza dos destinatarios distintos
  const firstRequest = validateSaleRequest({
    ...baseData,
    receiptEmail: 'primero@example.com'
  });
  const secondRequest = validateSaleRequest({
    ...baseData,
    receiptEmail: 'segundo@example.com'
  });

  assert.notEqual(
    buildRequestHash(firstRequest),
    buildRequestHash(secondRequest)
  );
});

test('construye identificadores estables para una cita', () => {
  // Normaliza una solicitud estable
  const request = validateSaleRequest({
    appointmentId: 'appointment_1',
    idempotencyKey: validKey,
    payments: [{
      method: 'tarjeta',
      amountCents: 31_500
    }]
  });

  // Construye el primer juego de identificadores
  const firstIdentifiers = buildSaleIdentifiers(request);

  // Construye el segundo juego de identificadores
  const secondIdentifiers = buildSaleIdentifiers(request);

  assert.deepEqual(firstIdentifiers, secondIdentifiers);
  assert.equal(firstIdentifiers.saleId, 'cita_appointment_1');
  assert.match(firstIdentifiers.folio, /^LS-[A-F0-9]{12}$/);
  assert.equal(buildRequestHash(request), buildRequestHash(request));
  assert.equal(
    buildDepositPaymentId('appointment_1'),
    'appointment_1_anticipo'
  );
});
