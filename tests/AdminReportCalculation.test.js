import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAdminReportTotals
} from '../src/modules/admin/reports/services/AdminReportCalculationService.js';
import {
  mapAdminReportPayment
} from '../src/modules/admin/reports/services/AdminReportMapperService.js';
import {
  getAdminReportPeriod
} from '../src/modules/admin/reports/services/AdminReportPeriodService.js';

// Construye una captura compatible con el mapeador
const buildSnapshot = (id, data) => ({
  data: () => data,
  id
});

// Construye una marca temporal compatible con Firestore
const buildTimestamp = (date) => ({
  toDate: () => date
});

// Verifica que un anticipo mixto conserve cada parte
test('separa el anticipo mixto por forma de pago', () => {
  const payment = mapAdminReportPayment(buildSnapshot('anticipo_1', {
    clienteId: 'cliente_1',
    estado: 'confirmado',
    fecha: buildTimestamp(new Date('2026-08-03T16:00:00.000Z')),
    metodo: 'mixto',
    montoCentavos: 13_500,
    partes: [
      {
        cambioCentavos: 6_500,
        efectivoRecibidoCentavos: 10_000,
        metodo: 'efectivo',
        montoCentavos: 3_500,
        referencia: ''
      },
      {
        metodo: 'transferencia',
        montoCentavos: 10_000,
        referencia: 'SPEI 123'
      }
    ],
    schemaVersion: 1,
    tipo: 'anticipo'
  }));
  const result = calculateAdminReportTotals([payment]);

  assert.equal(result.totals.totalReceivedCents, 13_500);
  assert.equal(result.totals.depositCents, 13_500);
  assert.equal(result.totals.methodTotals.efectivo, 3_500);
  assert.equal(result.totals.methodTotals.transferencia, 10_000);
});

// Verifica que el efectivo entregado no aumente el cobro
test('suma el importe aplicado y no el efectivo entregado', () => {
  const payment = mapAdminReportPayment(buildSnapshot('pago_1', {
    clienteId: 'cliente_1',
    efectivoRecibidoCentavos: 40_000,
    estado: 'confirmado',
    fecha: buildTimestamp(new Date('2026-08-03T20:00:00.000Z')),
    metodo: 'efectivo',
    montoCentavos: 31_500,
    referencia: '',
    schemaVersion: 1,
    tipo: 'liquidacion'
  }));
  const result = calculateAdminReportTotals([payment]);

  assert.equal(result.totals.totalReceivedCents, 31_500);
  assert.equal(result.totals.finalPaymentCents, 31_500);
  assert.equal(result.totals.methodTotals.efectivo, 31_500);
});

// Verifica las siete fechas civiles incluida la actual
test('construye los últimos siete días en la zona del negocio', () => {
  const period = getAdminReportPeriod(
    'lastSevenDays',
    new Date('2026-08-03T18:00:00.000Z')
  );

  assert.equal(period.start.toISOString(), '2026-07-28T06:00:00.000Z');
  assert.equal(period.end.toISOString(), '2026-08-04T06:00:00.000Z');
});
