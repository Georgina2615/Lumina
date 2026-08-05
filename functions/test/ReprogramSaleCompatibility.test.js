import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase-admin/firestore';
import {
  buildRequestHash,
  buildSaleIdentifiers
} from '../src/SaleIdentifiers.js';
import {
  validateSaleRequest
} from '../src/SalePolicy.js';
import {
  runSaleTransaction
} from '../src/SaleTransaction.js';
import {
  buildReprogramFirestore,
  buildReprogramRequestData,
  reprogramAppointment,
  reprogramIds
} from './ReprogramAppointmentFixture.js';

// Construye una diferencia mediante transferencia
const buildAdditionalDeposit = () => ({
  method: 'transferencia',
  payments: [{
    method: 'transferencia',
    amountCents: 6_000,
    cashReceivedCents: 0,
    changeCents: 0,
    reference: 'SPEI-DIFERENCIA',
    cardLastFour: ''
  }]
});

// Finaliza una cita reprogramada con todos sus pagos reales
test('el POS aplica ambos anticipos una sola vez', async () => {
  const firestore = buildReprogramFirestore({
    paymentOverrides: {
      fecha: Timestamp.fromMillis(1_000)
    }
  });
  const operationTimestamp = Timestamp.fromMillis(2_000);

  // Reprograma hacia un servicio con anticipo mayor
  const reprogramResult = await reprogramAppointment({
    firestore,
    requestData: buildReprogramRequestData({
      serviceId: 'anti-edad',
      additionalDeposit: buildAdditionalDeposit()
    }),
    serverTimestamp: () => operationTimestamp,
    toTimestamp: Timestamp.fromDate
  });
  const appointmentPath = `citas/${reprogramResult.appointmentId}`;
  const appointment = firestore.get(appointmentPath);

  // Simula el avance operativo hasta la columna de cobro
  firestore.set(appointmentPath, {
    ...appointment,
    estado: 'por_cobrar'
  });

  // Construye el cierre exacto del saldo pendiente
  const request = validateSaleRequest({
    appointmentId: reprogramResult.appointmentId,
    idempotencyKey: 'reprogram_sale_123456',
    productItems: [],
    payments: [{
      method: 'tarjeta',
      amountCents: 45_500,
      reference: 'TERMINAL-7788',
      cardLastFour: '7788'
    }]
  });
  const identifiers = buildSaleIdentifiers(request);
  const requestHash = buildRequestHash(request);

  const result = await runSaleTransaction({
    actorUid: reprogramIds.actorId,
    firestore,
    folio: identifiers.folio,
    request,
    requestHash,
    saleId: identifiers.saleId
  });

  const originalPaymentId = `${reprogramIds.sourceId}_anticipo`;
  const additionalPaymentId =
    `${reprogramResult.appointmentId}_anticipo_adicional`;
  const originalPayment = firestore.get(
    `pagos/${originalPaymentId}`
  );
  const additionalPayment = firestore.get(
    `pagos/${additionalPaymentId}`
  );
  const sale = firestore.get(`ventas/${identifiers.saleId}`);

  assert.deepEqual(result.totals, {
    subtotalCents: 56_034,
    taxCents: 8_966,
    totalCents: 65_000,
    depositCents: 19_500,
    balanceDueCents: 45_500,
    paidNowCents: 45_500,
    totalPaidCents: 65_000
  });
  assert.equal(sale.pagoAnticipoId, originalPaymentId);
  assert.deepEqual(sale.pagosAnticipoIds, [
    originalPaymentId,
    additionalPaymentId
  ]);
  assert.deepEqual(
    sale.metodosPago,
    ['efectivo', 'transferencia', 'tarjeta']
  );
  assert.equal(
    sale.desglose.anticipoAplicadoCentavos,
    19_500
  );
  assert.equal(originalPayment.ventaId, identifiers.saleId);
  assert.equal(additionalPayment.ventaId, identifiers.saleId);
  assert.equal(firestore.get(`cupos/${appointment.cupoId}`), undefined);
  assert.equal(
    firestore.get(appointmentPath).estado,
    'finalizada'
  );
});
