import assert from 'node:assert/strict';
import test from 'node:test';
import { retrySaleTicketHandler } from '../src/RetrySaleTicket.js';
import {
  attemptDate,
  buildTicketSale,
  createTicketFirestore
} from './SaleTicketTestFixture.js';

// Define una fecha posterior al enfriamiento
const retryDate = new Date(attemptDate.getTime() + 61_000);

// Construye un ticket rechazado por el proveedor
const buildFailedTicket = (overrides = {}) => ({
  estado: 'fallido',
  intentos: 1,
  intentoId: null,
  ultimoIntentoEn: attemptDate,
  enviadoEn: null,
  ultimoError: 'Fallo anterior',
  ...overrides
});

test('el callable exige identidad y estado fallido', async () => {
  // Prepara una venta pendiente y un actor autorizado
  const environment = createTicketFirestore({
    'usuarios/actor_1': { activo: true, rol: 'recepcion' },
    'ventas/sale_1': buildTicketSale()
  });

  await assert.rejects(
    () => retrySaleTicketHandler({
      auth: { uid: 'actor_1' },
      data: { saleId: 'sale_1' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'failed-precondition'
  );

  await assert.rejects(
    () => retrySaleTicketHandler({
      auth: null,
      data: { saleId: 'sale_1' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'unauthenticated'
  );
});

test('agenda un ticket fallido para el único trabajador', async () => {
  // Prepara un ticket fallido y un actor autorizado
  const environment = createTicketFirestore({
    'usuarios/actor_2': { activo: true, rol: 'recepcion' },
    'ventas/sale_2': buildTicketSale({
      ticket: buildFailedTicket()
    })
  });

  // Ejecuta la solicitud después del enfriamiento
  const result = await retrySaleTicketHandler({
    auth: { uid: 'actor_2' },
    data: { saleId: 'sale_2' },
    firestore: environment.firestore,
    now: () => retryDate.getTime(),
    serverTimestamp: () => retryDate
  });

  // Obtiene la solicitud persistida
  const ticket = environment.read('ventas/sale_2').ticket;

  assert.deepEqual(result, {
    saleId: 'sale_2',
    ticketStatus: 'pendiente',
    sent: false
  });
  assert.equal(ticket.estado, 'pendiente');
  assert.equal(ticket.intentos, 1);
  assert.equal(ticket.reintentoSolicitadoPor, 'actor_2');
  assert.deepEqual(ticket.reintentoSolicitadoEn, retryDate);
});

test('aplica un minuto de enfriamiento', async () => {
  // Prepara un fallo reciente
  const environment = createTicketFirestore({
    'usuarios/actor_3': { activo: true, rol: 'recepcion' },
    'ventas/sale_3': buildTicketSale({
      ticket: buildFailedTicket()
    })
  });

  await assert.rejects(
    () => retrySaleTicketHandler({
      auth: { uid: 'actor_3' },
      data: { saleId: 'sale_3' },
      firestore: environment.firestore,
      now: () => attemptDate.getTime() + 30_000
    }),
    (error) => error.code === 'aborted'
  );
});

test('limita cada ticket a tres intentos', async () => {
  // Prepara un ticket que agotó su cuota
  const environment = createTicketFirestore({
    'usuarios/actor_4': { activo: true, rol: 'recepcion' },
    'ventas/sale_4': buildTicketSale({
      ticket: buildFailedTicket({ intentos: 3 })
    })
  });

  await assert.rejects(
    () => retrySaleTicketHandler({
      auth: { uid: 'actor_4' },
      data: { saleId: 'sale_4' },
      firestore: environment.firestore,
      now: () => retryDate.getTime()
    }),
    (error) => error.code === 'resource-exhausted'
  );
});

test('administración habilita tres intentos nuevos con motivo', async () => {
  // Prepara un comprobante agotado y una administradora activa
  const environment = createTicketFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'ventas/sale_5': buildTicketSale({
      ticket: buildFailedTicket({ intentos: 3 })
    })
  });

  // Reactiva el envío después de corregir su configuración
  const result = await retrySaleTicketHandler({
    auth: { uid: 'admin_1' },
    data: {
      reason: 'Se corrigió la autorización del servicio de correo',
      restart: true,
      saleId: 'sale_5'
    },
    firestore: environment.firestore,
    serverTimestamp: () => retryDate
  });

  // Comprueba el nuevo grupo de intentos y su registro
  const ticket = environment.read('ventas/sale_5').ticket;
  const event = environment.read(
    'eventosComprobantes/sale_5_reactivacion_1'
  );
  assert.equal(result.action, 'restart');
  assert.equal(ticket.estado, 'pendiente');
  assert.equal(ticket.intentos, 0);
  assert.equal(ticket.reactivaciones, 1);
  assert.equal(event.actorUid, 'admin_1');
  assert.equal(event.intentosAnteriores, 3);
});

test('recepción no puede habilitar un comprobante agotado', async () => {
  // Prepara un comprobante agotado y una recepcionista activa
  const environment = createTicketFirestore({
    'usuarios/reception_1': { activo: true, rol: 'recepcion' },
    'ventas/sale_6': buildTicketSale({
      ticket: buildFailedTicket({ intentos: 3 })
    })
  });

  await assert.rejects(() => retrySaleTicketHandler({
    auth: { uid: 'reception_1' },
    data: {
      reason: 'Se corrigió la autorización del servicio de correo',
      restart: true,
      saleId: 'sale_6'
    },
    firestore: environment.firestore
  }), (error) => error.code === 'permission-denied');
});
