import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildAdminCashCloseRequest,
  calculateCashClosePreview,
  getPreviousBusinessDateKey,
  parseCashCloseCents
} from '../src/modules/admin/reports/cash-closing/services/AdminCashClosePolicy.js';

// Verifica la conversion exacta de pesos
test('convierte importes del corte a centavos enteros', () => {
  assert.equal(parseCashCloseCents('350'), 35_000);
  assert.equal(parseCashCloseCents('350.5'), 35_050);
  assert.equal(parseCashCloseCents('350.55'), 35_055);
  assert.equal(parseCashCloseCents('350.555'), null);
  assert.equal(parseCashCloseCents('-1'), null);
});

// Verifica el efectivo esperado y su diferencia
test('compara el efectivo contado contra el esperado', () => {
  const result = calculateCashClosePreview({
    form: {
      openingCash: '500',
      withdrawals: '100',
      countedCash: '800'
    },
    paymentTotals: { efectivo: 40_000 }
  });

  assert.equal(result.expectedCashCents, 80_000);
  assert.equal(result.differenceCents, 0);
});

// Verifica la fecha anterior en la zona del negocio
test('selecciona el ultimo dia terminado', () => {
  assert.equal(
    getPreviousBusinessDateKey(new Date('2026-08-04T18:00:00Z')),
    '2026-08-03'
  );
});

// Exige motivo al corregir un corte
test('construye una correccion con motivo obligatorio', () => {
  const form = {
    openingCash: '500',
    withdrawals: '100',
    countedCash: '800',
    reason: '  Segundo conteo de efectivo  '
  };
  const request = buildAdminCashCloseRequest({
    close: { revision: 2 },
    dateKey: '2026-08-03',
    form
  });

  assert.equal(request.action, 'correct');
  assert.equal(request.expectedRevision, 2);
  assert.equal(request.reason, 'Segundo conteo de efectivo');
});
