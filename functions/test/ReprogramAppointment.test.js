import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReprogramFirestore,
  buildReprogramRequestData,
  reprogramAppointment,
  reprogramIds
} from './ReprogramAppointmentFixture.js';

// Reprograma usando únicamente el crédito existente
test('reprograma sin duplicar el anticipo original', async () => {
  const firestore = buildReprogramFirestore();

  const result = await reprogramAppointment({ firestore });

  assert.equal(result.appointmentId, 'citas_1');
  assert.equal(result.clientId, reprogramIds.clientId);
  assert.equal(result.depositAmountCents, 13_500);
  assert.equal(result.creditAppliedCents, 13_500);
  assert.equal(result.additionalDepositCents, 0);
  assert.equal(result.alreadyProcessed, false);
  assert.deepEqual(
    result.depositPaymentIds,
    [`${reprogramIds.sourceId}_anticipo`]
  );

  const destination = firestore.get('citas/citas_1');
  const source = firestore.get(`citas/${reprogramIds.sourceId}`);
  const originalPayment = firestore.get(
    `pagos/${reprogramIds.sourceId}_anticipo`
  );

  assert.equal(destination.estado, 'por_confirmar');
  assert.equal(destination.reprogramacionOrigen, reprogramIds.sourceId);
  assert.equal(destination.anticipoRequeridoCentavos, 13_500);
  assert.equal(destination.anticipoMontoCentavos, 13_500);
  assert.equal(source.reprogramacion.estado, 'utilizada');
  assert.equal(source.cancelacion.reprogramacionDisponible, false);
  assert.equal(originalPayment.aplicadaACitaId, 'citas_1');
  assert.equal(
    firestore.get('pagos/citas_1_anticipo_adicional'),
    undefined
  );
});

// Registra solo la diferencia requerida
test('reprograma con una diferencia real de anticipo', async () => {
  const firestore = buildReprogramFirestore();
  const requestData = buildReprogramRequestData({
    serviceId: 'anti-edad',
    additionalDeposit: {
      method: 'transferencia',
      payments: [{
        method: 'transferencia',
        amountCents: 6_000,
        cashReceivedCents: 0,
        changeCents: 0,
        reference: 'SPEI-REPROGRAMACION',
        cardLastFour: ''
      }]
    }
  });

  const result = await reprogramAppointment({
    firestore,
    requestData
  });

  assert.equal(result.creditAppliedCents, 13_500);
  assert.equal(result.additionalDepositCents, 6_000);
  assert.equal(result.depositAmountCents, 19_500);
  assert.equal(result.alreadyProcessed, false);
  assert.deepEqual(result.depositPaymentIds, [
    `${reprogramIds.sourceId}_anticipo`,
    'citas_1_anticipo_adicional'
  ]);

  const destination = firestore.get('citas/citas_1');
  const additionalPayment = firestore.get(
    'pagos/citas_1_anticipo_adicional'
  );

  assert.equal(destination.anticipoRequeridoCentavos, 19_500);
  assert.equal(destination.anticipoMontoCentavos, 19_500);
  assert.equal(destination.anticipoMetodo, 'mixto');
  assert.equal(additionalPayment.montoCentavos, 6_000);
  assert.equal(additionalPayment.citaId, 'citas_1');
});

// Conserva el mismo destino ante un reintento
test('responde de forma idempotente al mismo destino', async () => {
  const firestore = buildReprogramFirestore();

  const first = await reprogramAppointment({ firestore });
  const second = await reprogramAppointment({
    firestore,
    now: new Date('2026-08-05T18:00:00.000Z')
  });

  assert.deepEqual(second, {
    ...first,
    alreadyProcessed: true
  });
  assert.equal(firestore.get('citas/citas_2'), undefined);
  assert.equal(firestore.lastTransaction.creations.length, 0);
  assert.equal(firestore.lastTransaction.updates.length, 0);
});

// Impide consumir la misma fuente en otro destino
test('rechaza un segundo destino para la misma fuente', async () => {
  const firestore = buildReprogramFirestore();

  await reprogramAppointment({ firestore });

  await assert.rejects(
    reprogramAppointment({
      firestore,
      requestData: buildReprogramRequestData({ time: '14:00' })
    }),
    /ya fue usado en otra reprogramación/
  );

  assert.equal(firestore.get('citas/citas_2'), undefined);
});

// Rechaza fuentes sin crédito otorgado por la clínica
test('rechaza una fuente de reprogramación inválida', async () => {
  const firestore = buildReprogramFirestore({
    sourceOverrides: {
      cancelacion: {
        origen: 'cliente',
        motivo: 'Cambio personal',
        anticipoResultado: 'retenido',
        reprogramacionDisponible: false
      }
    }
  });

  await assert.rejects(
    reprogramAppointment({ firestore }),
    /no tiene un anticipo disponible/
  );

  assert.equal(firestore.get('citas/citas_1'), undefined);
});

// Rechaza pagos financieros alterados
test('rechaza un pago original con importe alterado', async () => {
  const firestore = buildReprogramFirestore({
    paymentOverrides: {
      montoCentavos: 13_499
    }
  });

  await assert.rejects(
    reprogramAppointment({ firestore }),
    /no coincide con la cita/
  );

  assert.equal(firestore.get('citas/citas_1'), undefined);
});

// Conserva los mismos pagos en una cadena de reprogramaciones
test('reprograma de A a B y luego de B a C sin duplicar pagos', async () => {
  const firestore = buildReprogramFirestore();

  const first = await reprogramAppointment({ firestore });
  const appointmentB = firestore.get(
    `citas/${first.appointmentId}`
  );

  // Simula otra cancelación atribuible a la clínica
  firestore.set(`citas/${first.appointmentId}`, {
    ...appointmentB,
    estado: 'cancelada',
    cancelacion: {
      origen: 'clinica',
      motivo: 'Mantenimiento adicional',
      anticipoResultado: 'disponible_reprogramacion',
      reprogramacionDisponible: true
    },
    reprogramacion: {
      estado: 'disponible',
      anticipoDisponibleCentavos:
        appointmentB.anticipoMontoCentavos
    }
  });
  firestore.remove(`cupos/${appointmentB.cupoId}`);

  const second = await reprogramAppointment({
    firestore,
    requestData: buildReprogramRequestData({
      sourceAppointmentId: first.appointmentId,
      time: '14:00'
    })
  });

  const appointmentC = firestore.get(
    `citas/${second.appointmentId}`
  );
  const paymentId = `${reprogramIds.sourceId}_anticipo`;
  const payment = firestore.get(`pagos/${paymentId}`);
  const paymentPaths = [...firestore.documents.keys()]
    .filter((path) => path.startsWith('pagos/'));

  assert.equal(second.appointmentId, 'citas_2');
  assert.deepEqual(appointmentC.pagosAnticipoIds, [paymentId]);
  assert.equal(appointmentC.reprogramacionOrigen, 'citas_1');
  assert.equal(payment.citaId, reprogramIds.sourceId);
  assert.equal(payment.aplicadaACitaId, 'citas_2');
  assert.deepEqual(paymentPaths, [`pagos/${paymentId}`]);
  assert.equal(
    firestore.get('citas/citas_1').reprogramacion.aplicadaACitaId,
    'citas_2'
  );
});
