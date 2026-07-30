import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSaleTotals } from '../src/SaleCalculation.js';
import { SaleError } from '../src/SaleError.js';

test('desglosa el IVA incluido sin aumentar el total', () => {
  // Calcula una cita sin productos
  const totals = calculateSaleTotals({
    servicePriceCents: 45_000,
    depositCents: 13_500,
    productLines: [],
    payments: [{
      method: 'efectivo',
      amountCents: 31_500,
      cashReceivedCents: 32_000,
      changeCents: 500,
      reference: '',
      cardLastFour: ''
    }]
  });

  assert.deepEqual(totals, {
    subtotalCents: 38_793,
    taxCents: 6_207,
    totalCents: 45_000,
    serviceTotalCents: 45_000,
    productsTotalCents: 0,
    depositCents: 13_500,
    balanceDueCents: 31_500,
    paidNowCents: 31_500,
    totalPaidCents: 45_000
  });
});

test('incluye productos y conserva el anticipo como pago previo', () => {
  // Calcula una cita con productos
  const totals = calculateSaleTotals({
    servicePriceCents: 35_000,
    depositCents: 10_500,
    productLines: [{
      unitPriceCents: 20_000,
      quantity: 2
    }],
    payments: [{
      amountCents: 64_500
    }]
  });

  assert.equal(totals.totalCents, 75_000);
  assert.equal(totals.depositCents, 10_500);
  assert.equal(totals.balanceDueCents, 64_500);
  assert.equal(totals.totalPaidCents, 75_000);
});

test('rechaza pagos que no cubren el saldo exacto', () => {
  assert.throws(
    () => calculateSaleTotals({
      servicePriceCents: 45_000,
      depositCents: 13_500,
      productLines: [],
      payments: [{ amountCents: 30_000 }]
    }),
    (error) => (
      error instanceof SaleError
      && error.code === 'failed-precondition'
    )
  );
});
