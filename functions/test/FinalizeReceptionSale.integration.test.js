import assert from 'node:assert/strict';
import test from 'node:test';
import { finalizeReceptionSaleHandler } from '../src/FinalizeReceptionSale.js';
import {
  cleanupIntegrationScenario,
  createIntegrationScenario,
  seedIntegrationScenario
} from './FinalizeReceptionSaleFixture.js';

// Confirma que nunca se conecte con producción
const emulatorHost = globalThis.process?.env?.FIRESTORE_EMULATOR_HOST;

// Valida el cierre completo sin tocar servicios reales
test('finaliza una venta atómica y conserva la idempotencia', {
  skip: emulatorHost ? false : 'Requiere FIRESTORE_EMULATOR_HOST'
}, async (context) => {
  // Evita cualquier ejecución fuera del emulador
  if (!emulatorHost) {
    // Finaliza la prueba sin crear conexiones
    return;
  }

  // Construye un escenario aislado
  const scenario = createIntegrationScenario();

  // Garantiza la limpieza del emulador
  context.after(() => cleanupIntegrationScenario(scenario));

  await seedIntegrationScenario(scenario);

  // Ejecuta el primer cierre
  const firstResult = await finalizeReceptionSaleHandler({
    auth: { uid: scenario.actorUid },
    data: scenario.requestData,
    firestore: scenario.firestore
  });

  assert.equal(firstResult.alreadyProcessed, false);
  assert.equal(firstResult.saleId, scenario.saleId);
  assert.equal(firstResult.recipientEmail, 'cliente.integracion@example.com');
  assert.equal(firstResult.ticketStatus, 'pendiente');
  assert.deepEqual(firstResult.totals, {
    subtotalCents: 73_276,
    taxCents: 11_724,
    totalCents: 85_000,
    depositCents: 13_500,
    balanceDueCents: 71_500,
    paidNowCents: 71_500,
    totalPaidCents: 85_000
  });

  // Lee todos los resultados de la transacción
  const [
    saleSnapshot,
    depositSnapshot,
    cashPaymentSnapshot,
    transferPaymentSnapshot,
    productSnapshot,
    movementSnapshot,
    appointmentSnapshot,
    eventSnapshot
  ] = await scenario.firestore.getAll(
    scenario.references.sale,
    scenario.references.deposit,
    scenario.references.cashPayment,
    scenario.references.transferPayment,
    scenario.references.product,
    scenario.references.movement,
    scenario.references.appointment,
    scenario.eventReference
  );

  assert.equal(saleSnapshot.data().estado, 'pagada');
  assert.equal(saleSnapshot.data().desglose.totalCentavos, 85_000);
  assert.equal(saleSnapshot.data().items.length, 2);
  assert.deepEqual(
    saleSnapshot.data().metodosPago,
    ['efectivo', 'transferencia']
  );
  assert.equal(saleSnapshot.data().ticket.estado, 'pendiente');
  assert.equal(
    saleSnapshot.data().pagoAnticipoId,
    scenario.references.deposit.id
  );
  assert.equal(
    scenario.references.deposit.id,
    `${scenario.appointmentId}_anticipo`
  );
  assert.equal(depositSnapshot.data().ventaId, scenario.saleId);
  assert.equal(depositSnapshot.data().metodo, 'efectivo');
  assert.equal(depositSnapshot.data().partes.length, 1);
  assert.equal(depositSnapshot.data().partes[0].montoCentavos, 13_500);
  assert.equal(cashPaymentSnapshot.data().montoCentavos, 30_000);
  assert.equal(cashPaymentSnapshot.data().cambioCentavos, 10_000);
  assert.equal(transferPaymentSnapshot.data().montoCentavos, 41_500);
  assert.equal(
    transferPaymentSnapshot.data().referencia,
    'SPEI-INTEGRACION'
  );
  assert.equal(productSnapshot.data().existencias, 28);
  assert.equal(movementSnapshot.data().existenciasAnteriores, 30);
  assert.equal(movementSnapshot.data().existenciasPosteriores, 28);
  assert.equal(appointmentSnapshot.data().estado, 'finalizada');
  assert.equal(appointmentSnapshot.data().ventaId, scenario.saleId);
  assert.equal(eventSnapshot.data().estadoNuevo, 'finalizada');

  // Repite exactamente la misma solicitud
  const repeatedResult = await finalizeReceptionSaleHandler({
    auth: { uid: scenario.actorUid },
    data: scenario.requestData,
    firestore: scenario.firestore
  });

  assert.equal(repeatedResult.alreadyProcessed, true);
  assert.equal(repeatedResult.saleId, scenario.saleId);
  assert.equal(
    repeatedResult.recipientEmail,
    'cliente.integracion@example.com'
  );
  assert.equal(repeatedResult.ticketStatus, 'pendiente');

  // Comprueba que el reintento no descuente inventario otra vez
  const stockAfterRetry = await scenario.references.product.get();
  assert.equal(stockAfterRetry.data().existencias, 28);
});
