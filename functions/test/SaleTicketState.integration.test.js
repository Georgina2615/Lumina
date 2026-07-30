import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import {
  deleteApp,
  initializeApp
} from 'firebase-admin/app';
import {
  FieldValue,
  getFirestore
} from 'firebase-admin/firestore';
import { claimSaleTicket } from '../src/SaleTicketState.js';
import { buildTicketSale } from './SaleTicketTestFixture.js';

// Confirma que nunca se conecte con producción
const emulatorHost = globalThis.process?.env?.FIRESTORE_EMULATOR_HOST;

// Comprueba la reclamación exclusiva con transacciones reales
test('permite una sola reclamación concurrente del ticket', {
  skip: emulatorHost ? false : 'Requiere FIRESTORE_EMULATOR_HOST'
}, async (context) => {
  // Evita cualquier ejecución fuera del emulador
  if (!emulatorHost) {
    // Finaliza la prueba sin crear conexiones
    return;
  }

  // Construye identificadores aislados
  const suffix = randomUUID().replaceAll('-', '');

  // Inicializa una aplicación exclusiva
  const app = initializeApp(
    { projectId: 'demo-lumina' },
    `ticket-state-integration-${suffix}`
  );

  // Obtiene Firestore enlazado al emulador
  const firestore = getFirestore(app);

  // Identifica la venta exclusiva
  const saleId = `sale_ticket_${suffix}`;

  // Construye la referencia real de prueba
  const saleReference = firestore.collection('ventas').doc(saleId);

  // Garantiza la limpieza del escenario
  context.after(async () => {
    await saleReference.delete();
    await deleteApp(app);
  });

  // Persiste un único ticket pendiente
  await saleReference.set(buildTicketSale());

  // Define dos eventos independientes
  const attemptIds = [
    `event_first_${suffix}`,
    `event_second_${suffix}`
  ];

  // Ejecuta ambas reclamaciones al mismo tiempo
  const results = await Promise.all(attemptIds.map((attemptId) => (
    claimSaleTicket({
      attemptId,
      firestore,
      saleId,
      serverTimestamp: () => FieldValue.serverTimestamp()
    })
  )));

  // Separa el único resultado ganador
  const claimedResults = results.filter(({ status }) => status === 'claimed');

  // Separa el resultado que perdió la carrera
  const skippedResults = results.filter(({ status }) => status === 'skipped');

  assert.equal(claimedResults.length, 1);
  assert.equal(skippedResults.length, 1);
  assert.equal(skippedResults[0].ticketStatus, 'enviando');

  // Lee el estado final persistido
  const storedSale = (await saleReference.get()).data();

  assert.equal(storedSale.ticket.estado, 'enviando');
  assert.equal(storedSale.ticket.intentos, 1);
  assert.ok(attemptIds.includes(storedSale.ticket.intentoId));
});
