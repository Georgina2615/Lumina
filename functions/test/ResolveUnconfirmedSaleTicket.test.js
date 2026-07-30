import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resolveUnconfirmedSaleTicketHandler
} from '../src/ResolveUnconfirmedSaleTicket.js';
import {
  attemptDate,
  buildTicketSale,
  createTicketFirestore
} from './SaleTicketTestFixture.js';

// Define una fecha posterior al enfriamiento
const resolutionDate = new Date(attemptDate.getTime() + 61_000);

// Construye una entrega ambigua
const buildUnconfirmedTicket = (overrides = {}) => ({
  estado: 'no_confirmado',
  intentos: 1,
  intentoId: null,
  ultimoIntentoEn: attemptDate,
  enviadoEn: null,
  ultimoError: 'Revisa EmailJS antes de intentar otro envío',
  ...overrides
});

test('exige identidad y una acción conocida', async () => {
  // Prepara una venta ambigua
  const environment = createTicketFirestore({
    'usuarios/actor_1': { activo: true, rol: 'recepcion' },
    'ventas/sale_1': buildTicketSale({
      ticket: buildUnconfirmedTicket()
    })
  });

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: null,
      data: { saleId: 'sale_1', action: 'confirmed' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'unauthenticated'
  );

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: { uid: 'actor_1' },
      data: { saleId: 'sale_1', action: 'unknown' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'invalid-argument'
  );
});

test('confirma manualmente una entrega verificada', async () => {
  // Prepara una venta y una recepcionista
  const environment = createTicketFirestore({
    'usuarios/actor_2': { activo: true, rol: 'recepcion' },
    'ventas/sale_2': buildTicketSale({
      ticket: buildUnconfirmedTicket({ intentos: 3 })
    })
  });

  // Confirma el historial revisado en EmailJS
  const result = await resolveUnconfirmedSaleTicketHandler({
    auth: { uid: 'actor_2' },
    data: { saleId: 'sale_2', action: 'confirmed' },
    firestore: environment.firestore,
    serverTimestamp: () => resolutionDate
  });

  // Obtiene el ticket resuelto
  const ticket = environment.read('ventas/sale_2').ticket;

  assert.deepEqual(result, {
    action: 'confirmed',
    saleId: 'sale_2',
    ticketStatus: 'enviado',
    sent: true
  });
  assert.equal(ticket.estado, 'enviado');
  assert.equal(ticket.intentos, 3);
  assert.deepEqual(ticket.enviadoEn, resolutionDate);
  assert.equal(ticket.resolucionManual, 'confirmado');
  assert.deepEqual(ticket.resolucionManualEn, resolutionDate);
  assert.equal(ticket.resolucionManualPor, 'actor_2');
  assert.equal(ticket.ultimoError, '');
});

test('agenda otro intento después de revisión humana', async () => {
  // Prepara una venta y una administradora
  const environment = createTicketFirestore({
    'usuarios/admin_1': { activo: true, rol: 'admin' },
    'ventas/sale_3': buildTicketSale({
      ticket: buildUnconfirmedTicket()
    })
  });

  // Solicita el reintento después del enfriamiento
  const result = await resolveUnconfirmedSaleTicketHandler({
    auth: { uid: 'admin_1' },
    data: { saleId: 'sale_3', action: 'retry' },
    firestore: environment.firestore,
    now: () => resolutionDate.getTime(),
    serverTimestamp: () => resolutionDate
  });

  // Obtiene el ticket reencolado
  const ticket = environment.read('ventas/sale_3').ticket;

  assert.deepEqual(result, {
    action: 'retry',
    saleId: 'sale_3',
    ticketStatus: 'pendiente',
    sent: false
  });
  assert.equal(ticket.estado, 'pendiente');
  assert.equal(ticket.intentos, 1);
  assert.equal(ticket.intentoId, null);
  assert.equal(ticket.resolucionManual, 'reintento');
  assert.deepEqual(ticket.resolucionManualEn, resolutionDate);
  assert.equal(ticket.resolucionManualPor, 'admin_1');
  assert.deepEqual(ticket.reintentoSolicitadoEn, resolutionDate);
  assert.equal(ticket.reintentoSolicitadoPor, 'admin_1');
  assert.equal(ticket.ultimoError, '');
});

test('rechaza actores ajenos a recepción y administración', async () => {
  // Prepara una identidad clínica
  const environment = createTicketFirestore({
    'usuarios/clinical_1': { activo: true, rol: 'cosmetologa' },
    'ventas/sale_4': buildTicketSale({
      ticket: buildUnconfirmedTicket()
    })
  });

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: { uid: 'clinical_1' },
      data: { saleId: 'sale_4', action: 'confirmed' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'permission-denied'
  );
});

test('rechaza ventas ausentes y estados ya resueltos', async () => {
  // Prepara un actor y una venta enviada
  const environment = createTicketFirestore({
    'usuarios/actor_5': { activo: true, rol: 'recepcion' },
    'ventas/sale_5': buildTicketSale({
      ticket: {
        ...buildUnconfirmedTicket(),
        estado: 'enviado'
      }
    })
  });

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: { uid: 'actor_5' },
      data: { saleId: 'missing_sale', action: 'confirmed' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'not-found'
  );

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: { uid: 'actor_5' },
      data: { saleId: 'sale_5', action: 'retry' },
      firestore: environment.firestore
    }),
    (error) => error.code === 'failed-precondition'
  );
});

test('aplica enfriamiento y máximo también al estado ambiguo', async () => {
  // Prepara dos entregas con límites distintos
  const environment = createTicketFirestore({
    'usuarios/actor_6': { activo: true, rol: 'recepcion' },
    'ventas/cooldown_sale': buildTicketSale({
      ticket: buildUnconfirmedTicket()
    }),
    'ventas/exhausted_sale': buildTicketSale({
      ticket: buildUnconfirmedTicket({ intentos: 3 })
    })
  });

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: { uid: 'actor_6' },
      data: { saleId: 'cooldown_sale', action: 'retry' },
      firestore: environment.firestore,
      now: () => attemptDate.getTime() + 30_000
    }),
    (error) => error.code === 'aborted'
  );

  await assert.rejects(
    () => resolveUnconfirmedSaleTicketHandler({
      auth: { uid: 'actor_6' },
      data: { saleId: 'exhausted_sale', action: 'retry' },
      firestore: environment.firestore,
      now: () => resolutionDate.getTime()
    }),
    (error) => error.code === 'resource-exhausted'
  );
});
