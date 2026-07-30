import assert from 'node:assert/strict';
import test from 'node:test';
import { EmailJsTransportError } from '../src/EmailJsTransport.js';
import { sendSaleTicketHandler } from '../src/SendSaleTicket.js';
import {
  attemptDate,
  buildTicketSale,
  createTicketFirestore
} from './SaleTicketTestFixture.js';

test('reclama y confirma un ticket pendiente', async () => {
  // Prepara una venta pendiente
  const environment = createTicketFirestore({
    'ventas/sale_1': buildTicketSale()
  });

  // Conserva las variables enviadas
  let sentParameters;

  // Ejecuta el envío automático
  const result = await sendSaleTicketHandler({
    attemptId: 'event_1',
    firestore: environment.firestore,
    saleId: 'sale_1',
    sendEmail: async ({ templateParameters }) => {
      sentParameters = templateParameters;
    },
    serverTimestamp: () => attemptDate
  });

  // Obtiene el ticket persistido
  const ticket = environment.read('ventas/sale_1').ticket;

  assert.equal(result.outcome, 'sent');
  assert.equal(result.ticketStatus, 'enviado');
  assert.equal(result.sent, true);
  assert.equal(sentParameters.to_email, 'cliente@example.com');
  assert.equal(ticket.estado, 'enviado');
  assert.equal(ticket.intentos, 1);
  assert.equal(ticket.intentoId, null);
  assert.deepEqual(ticket.enviadoEn, attemptDate);
  assert.equal(ticket.ultimoError, '');
});

test('conserva la venta ante un rechazo confirmado', async () => {
  // Prepara una venta pendiente
  const environment = createTicketFirestore({
    'ventas/sale_2': buildTicketSale()
  });

  // Ejecuta un proveedor que rechazó la autorización
  const result = await sendSaleTicketHandler({
    attemptId: 'event_2',
    firestore: environment.firestore,
    saleId: 'sale_2',
    sendEmail: async () => {
      throw new EmailJsTransportError(
        'authorization',
        'Detalle privado que no debe persistir'
      );
    },
    serverTimestamp: () => attemptDate
  });

  // Obtiene la venta después del fallo
  const storedSale = environment.read('ventas/sale_2');

  assert.equal(storedSale.estado, 'pagada');
  assert.equal(storedSale.ticket.estado, 'fallido');
  assert.equal(storedSale.ticket.intentos, 1);
  assert.equal(result.errorCode, 'authorization');
  assert.doesNotMatch(storedSale.ticket.ultimoError, /Detalle privado/);
});

test('bloquea reenvíos cuando la entrega es ambigua', async () => {
  // Prepara una venta pendiente
  const environment = createTicketFirestore({
    'ventas/sale_3': buildTicketSale()
  });

  // Ejecuta una conexión con resultado desconocido
  const result = await sendSaleTicketHandler({
    attemptId: 'event_3',
    firestore: environment.firestore,
    saleId: 'sale_3',
    sendEmail: async () => {
      throw new EmailJsTransportError(
        'timeout',
        'Respuesta incierta del proveedor'
      );
    },
    serverTimestamp: () => attemptDate
  });

  // Obtiene el estado conservador
  const ticket = environment.read('ventas/sale_3').ticket;

  assert.equal(result.outcome, 'unconfirmed');
  assert.equal(result.ticketStatus, 'no_confirmado');
  assert.equal(ticket.estado, 'no_confirmado');
  assert.doesNotMatch(ticket.ultimoError, /incierta/);
});

test('omite ventas sin correo sin llamar al proveedor', async () => {
  // Prepara una venta sin destinatario
  const environment = createTicketFirestore({
    'ventas/sale_4': buildTicketSale({ clienteEmail: '' })
  });

  // Conserva la cantidad de envíos
  let sendCount = 0;

  // Ejecuta el flujo automático
  const result = await sendSaleTicketHandler({
    attemptId: 'event_4',
    firestore: environment.firestore,
    saleId: 'sale_4',
    sendEmail: async () => {
      sendCount += 1;
    },
    serverTimestamp: () => attemptDate
  });

  assert.equal(result.outcome, 'omitido');
  assert.equal(result.ticketStatus, 'omitido');
  assert.equal(sendCount, 0);
  assert.equal(
    environment.read('ventas/sale_4').ticket.estado,
    'omitido'
  );
});

test('impide repetir un evento ya confirmado', async () => {
  // Prepara una venta pendiente
  const environment = createTicketFirestore({
    'ventas/sale_5': buildTicketSale()
  });

  // Conserva la cantidad de envíos
  let sendCount = 0;

  // Define el proveedor observable
  const sendEmail = async () => {
    sendCount += 1;
  };

  // Ejecuta el evento original
  await sendSaleTicketHandler({
    attemptId: 'event_5',
    firestore: environment.firestore,
    saleId: 'sale_5',
    sendEmail,
    serverTimestamp: () => attemptDate
  });

  // Repite el mismo evento
  const duplicate = await sendSaleTicketHandler({
    attemptId: 'event_5',
    firestore: environment.firestore,
    saleId: 'sale_5',
    sendEmail,
    serverTimestamp: () => attemptDate
  });

  assert.equal(duplicate.outcome, 'skipped');
  assert.equal(duplicate.ticketStatus, 'enviado');
  assert.equal(sendCount, 1);
});

test('recupera un cierre incierto sin reenviar', async () => {
  // Falla únicamente la confirmación posterior al proveedor
  const environment = createTicketFirestore(
    { 'ventas/sale_6': buildTicketSale() },
    { failingTransactions: [2] }
  );

  // Conserva la cantidad de envíos
  let sendCount = 0;

  // Define el proveedor observable
  const sendEmail = async () => {
    sendCount += 1;
  };

  await assert.rejects(
    () => sendSaleTicketHandler({
      attemptId: 'event_6',
      firestore: environment.firestore,
      saleId: 'sale_6',
      sendEmail,
      serverTimestamp: () => attemptDate
    }),
    /transaccional/
  );

  // Reprocesa únicamente el evento fallido
  const recovered = await sendSaleTicketHandler({
    attemptId: 'event_6',
    firestore: environment.firestore,
    saleId: 'sale_6',
    sendEmail,
    serverTimestamp: () => attemptDate
  });

  assert.equal(recovered.outcome, 'unconfirmed');
  assert.equal(recovered.ticketStatus, 'no_confirmado');
  assert.equal(sendCount, 1);
  assert.equal(
    environment.read('ventas/sale_6').ticket.estado,
    'no_confirmado'
  );
});
