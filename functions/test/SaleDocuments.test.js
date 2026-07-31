import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSaleDocument } from '../src/SaleDocuments.js';

// Construye argumentos mínimos de una venta
const buildArguments = (overrides = {}) => ({
  actorUid: 'actor_1',
  appointment: null,
  client: null,
  depositPaymentIds: [],
  depositPayments: [],
  checkoutPaymentIds: ['payment_1'],
  folio: 'LS-TEST',
  inventoryWarnings: [],
  request: {
    appointmentId: null,
    idempotencyKey: 'operation_123456789',
    payments: [{ method: 'tarjeta' }],
    receiptEmail: ''
  },
  requestHash: 'hash',
  products: [{
    id: 'product_1',
    name: 'Producto Real',
    category: 'Cuidado facial',
    quantity: 1,
    unitPriceCents: 10_000
  }],
  timestamp: new Date('2026-07-29T20:30:00.000Z'),
  totals: {
    subtotalCents: 8_621,
    taxCents: 1_379,
    totalCents: 10_000,
    serviceTotalCents: 0,
    productsTotalCents: 10_000,
    depositCents: 0,
    balanceDueCents: 10_000,
    totalPaidCents: 10_000
  },
  ...overrides
});

test('crea un ticket pendiente para correo temporal validado', () => {
  // Construye una venta de mostrador con correo
  const sale = buildSaleDocument(buildArguments({
    request: {
      appointmentId: null,
      idempotencyKey: 'operation_123456789',
      payments: [{ method: 'tarjeta' }],
      receiptEmail: 'cliente@example.com'
    }
  }));

  assert.equal(sale.clienteEmail, 'cliente@example.com');
  assert.equal(sale.ticket.estado, 'pendiente');
});

test('omite el ticket cuando no existe correo', () => {
  // Construye una venta sin destinatario
  const sale = buildSaleDocument(buildArguments());

  assert.equal(sale.clienteEmail, '');
  assert.equal(sale.ticket.estado, 'omitido');
  assert.equal(sale.pagoAnticipoId, null);
  assert.deepEqual(sale.pagosAnticipoIds, []);
});

test('incluye métodos de anticipo y liquidación sin duplicados', () => {
  // Construye una cita con anticipo mixto
  const sale = buildSaleDocument(buildArguments({
    appointment: {
      servicioId: 'service_1',
      servicio: 'Limpieza facial profunda',
      precioServicioCentavos: 45_000
    },
    depositPaymentIds: ['payment_original', 'payment_additional'],
    depositPayments: [
      {
        partes: [
          { metodo: 'efectivo' },
          { metodo: 'transferencia' }
        ]
      },
      {
        partes: [{ metodo: 'transferencia' }]
      }
    ],
    client: {
      id: 'client_1',
      name: 'Cliente Real',
      email: 'directorio@example.com'
    },
    request: {
      appointmentId: 'appointment_1',
      idempotencyKey: 'operation_123456789',
      payments: [
        { method: 'transferencia' },
        { method: 'tarjeta' }
      ],
      receiptEmail: ''
    }
  }));

  assert.deepEqual(
    sale.metodosPago,
    ['efectivo', 'transferencia', 'tarjeta']
  );
  assert.equal(sale.clienteEmail, 'directorio@example.com');
  assert.equal(sale.pagoAnticipoId, 'payment_original');
  assert.deepEqual(
    sale.pagosAnticipoIds,
    ['payment_original', 'payment_additional']
  );
});
