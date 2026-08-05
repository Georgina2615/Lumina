import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCashCloseRequestHash,
  CashCloseError,
  validateCashCloseRequest
} from '../src/CashClosePolicy.js';
import { calculateCashClosePayments } from '../src/CashClosePaymentService.js';
import { runManageCashCloseTransaction } from '../src/ManageCashCloseTransaction.js';
import { FakeAppointmentFirestore } from './AppointmentTransactionFixture.js';

const now = new Date('2026-08-04T18:00:00.000Z');
const buildRequest = (overrides = {}) => ({
  action: 'close',
  dateKey: '2026-08-03',
  openingCashCents: 50_000,
  withdrawalsCents: 10_000,
  countedCashCents: 80_000,
  operationId: 'cash_close_123',
  ...overrides
});
const snapshot = (id, data) => ({ id, data: () => data });
const paymentSummary = {
  methodTotals: { efectivo: 40_000, tarjeta: 20_000, transferencia: 10_000 },
  paymentCount: 3,
  paymentFingerprint: 'fingerprint',
  totalCents: 70_000
};

test('acepta solo fechas terminadas e importes enteros', () => {
  const request = validateCashCloseRequest(buildRequest(), now);
  assert.equal(request.dateKey, '2026-08-03');
  assert.equal(buildCashCloseRequestHash(request).length, 64);
  assert.throws(
    () => validateCashCloseRequest(buildRequest({ dateKey: '2026-08-04' }), now),
    (error) => error instanceof CashCloseError
      && error.code === 'failed-precondition'
  );
});

test('suma pagos mixtos sin contar el cambio entregado', () => {
  const result = calculateCashClosePayments([
    snapshot('deposit', {
      schemaVersion: 1,
      estado: 'confirmado',
      tipo: 'anticipo',
      metodo: 'mixto',
      montoCentavos: 13_500,
      partes: [
        { metodo: 'efectivo', montoCentavos: 3_500, efectivoRecibidoCentavos: 10_000 },
        { metodo: 'transferencia', montoCentavos: 10_000 }
      ]
    }),
    snapshot('checkout', {
      schemaVersion: 1,
      estado: 'confirmado',
      tipo: 'liquidacion',
      metodo: 'tarjeta',
      montoCentavos: 31_500
    })
  ]);

  assert.equal(result.methodTotals.efectivo, 3_500);
  assert.equal(result.methodTotals.transferencia, 10_000);
  assert.equal(result.methodTotals.tarjeta, 31_500);
  assert.equal(result.totalCents, 45_000);
});

test('guarda un corte y calcula la diferencia de efectivo', async () => {
  const firestore = new FakeAppointmentFirestore({
    'usuarios/admin': { activo: true, rol: 'admin' }
  });
  const request = validateCashCloseRequest(buildRequest(), now);
  const result = await runManageCashCloseTransaction({
    actorUid: 'admin',
    firestore,
    paymentSummary,
    request,
    requestHash: buildCashCloseRequestHash(request),
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  });

  assert.equal(result.efectivoEsperadoCentavos, 80_000);
  assert.equal(result.diferenciaEfectivoCentavos, 0);
  assert.equal(firestore.get('cortesCaja/2026-08-03').revision, 1);
  assert.equal(
    firestore.get('cambiosCortesCaja/cash_close_123').actorUid,
    'admin'
  );
});

test('corrige un corte solo con motivo y revision vigente', async () => {
  const firestore = new FakeAppointmentFirestore({
    'usuarios/admin': { activo: true, rol: 'admin' },
    'cortesCaja/2026-08-03': {
      revision: 1,
      efectivoContadoCentavos: 79_000
    }
  });
  const request = validateCashCloseRequest(buildRequest({
    action: 'correct',
    countedCashCents: 80_000,
    reason: 'Se contó nuevamente el efectivo',
    expectedRevision: 1,
    operationId: 'cash_close_correction'
  }), now);

  const result = await runManageCashCloseTransaction({
    actorUid: 'admin',
    firestore,
    paymentSummary,
    request,
    requestHash: buildCashCloseRequestHash(request),
    serverTimestamp: () => 'SERVER_TIMESTAMP'
  });

  assert.equal(result.revision, 2);
  assert.equal(firestore.get('cortesCaja/2026-08-03').revision, 2);
  assert.equal(
    firestore.get('cambiosCortesCaja/cash_close_correction').motivo,
    'Se contó nuevamente el efectivo'
  );
});
