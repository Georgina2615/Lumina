import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails, assertSucceeds, initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteDoc, doc, serverTimestamp, setDoc, updateDoc, writeBatch
} from 'firebase/firestore';
import {
  buildEmbeddedDeposit,
  buildTestAppointment,
  buildTestClient,
  buildTestDepositPayment,
  buildTestIdentity,
  buildMixedEmbeddedDeposit,
  buildTestService,
  buildTestSlot,
  testIds
} from './FirestoreRulesTestData.js';

// Conserva el entorno aislado de reglas
let testEnvironment;

// Carga las reglas locales
before(async () => {
  // Obtiene el archivo vigente
  const rules = await readFile(
    new URL('../firestore.rules', import.meta.url),
    'utf8'
  );

  // Inicializa Firestore Emulator
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-lumina',
    firestore: { rules }
  });
});

// Restablece cada escenario
beforeEach(async () => {
  // Elimina únicamente datos del emulador
  await testEnvironment.clearFirestore();

  // Crea identidades canónicas sin aplicar reglas
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    // Obtiene la base aislada
    const database = context.firestore();

    // Registra el usuario operativo
    await setDoc(doc(database, 'usuarios', testIds.userId), {
      correo: 'recepcion@example.com',
      rol: 'recepcion',
      activo: true
    });
    await setDoc(doc(database, 'clientes', testIds.clientId), buildTestClient());
    await setDoc(
      doc(database, 'identidadesClientes', 'telefono:9991112233'),
      buildTestIdentity('telefono', '9991112233')
    );
    await setDoc(
      doc(database, 'identidadesClientes', 'correo:reglas@example.com'),
      buildTestIdentity('correo', 'reglas@example.com')
    );
    await setDoc(
      doc(database, 'servicios', testIds.serviceId),
      buildTestService()
    );
  });
});

// Cierra los procesos del emulador
after(async () => {
  // Libera conexiones locales
  await testEnvironment.cleanup();
});

// Construye una reserva completa
const createBookingBatch = (database, {
  includeClient = false,
  includePayments = true,
  depositPayments = [buildEmbeddedDeposit()],
  paymentOverrides = {}
} = {}) => {
  // Crea una única escritura atómica
  const batch = writeBatch(database);
  const timestamp = serverTimestamp();

  // Registra la cita y el cupo
  batch.set(
    doc(database, 'citas', testIds.appointmentId),
    buildTestAppointment({ timestamp, depositPayments })
  );
  batch.set(
    doc(database, 'cupos', testIds.slotId),
    buildTestSlot({ timestamp })
  );

  // Registra el cliente cuando corresponde
  if (includeClient) {
    batch.set(
      doc(database, 'clientes', testIds.clientId),
      buildTestClient({ actorUid: testIds.userId, timestamp })
    );
    batch.set(
      doc(database, 'identidadesClientes', 'telefono:9991112233'),
      buildTestIdentity('telefono', '9991112233', {
        actorUid: testIds.userId,
        timestamp
      })
    );
    batch.set(
      doc(database, 'identidadesClientes', 'correo:reglas@example.com'),
      buildTestIdentity('correo', 'reglas@example.com', {
        actorUid: testIds.userId,
        timestamp
      })
    );
  }

  // Registra el anticipo consolidado cuando corresponde
  if (includePayments) {
    batch.set(
      doc(database, 'pagos', `${testIds.appointmentId}_anticipo`),
      {
        ...buildTestDepositPayment({ depositPayments, timestamp }),
        ...paymentOverrides
      }
    );
  }

  // Devuelve la operación pendiente
  return batch;
};

// Rechaza reservas directas desde el navegador
test('rechaza crear cita cupo y anticipo sin la función segura', async () => {
  // Obtiene una sesión de recepción
  const context = testEnvironment.authenticatedContext(testIds.userId);
  const batch = createBookingBatch(context.firestore());

  // Comprueba el cierre de la escritura directa
  await assertFails(batch.commit());
});

// Rechaza reservas sin movimiento financiero
test('rechaza una cita cuando falta el registro del anticipo', async () => {
  // Obtiene una sesión de recepción
  const context = testEnvironment.authenticatedContext(testIds.userId);
  const batch = createBookingBatch(context.firestore(), {
    includePayments: false
  });

  // Comprueba el rechazo atómico
  await assertFails(batch.commit());
});

// Rechaza anticipos que no coinciden con la cita
test('rechaza un anticipo consolidado con importe alterado', async () => {
  // Obtiene una sesión de recepción
  const context = testEnvironment.authenticatedContext(testIds.userId);
  const batch = createBookingBatch(context.firestore(), {
    paymentOverrides: { montoCentavos: 13499 }
  });

  // Comprueba la coincidencia financiera
  await assertFails(batch.commit());
});

// Rechaza anticipos mixtos creados fuera del servidor
test('rechaza un anticipo mixto creado directamente', async () => {
  // Construye las dos partes persistentes
  const depositPayments = buildMixedEmbeddedDeposit();
  // Obtiene una sesión de recepción
  const context = testEnvironment.authenticatedContext(testIds.userId);
  const batch = createBookingBatch(
    context.firestore(),
    { depositPayments }
  );

  // Comprueba el cierre del contrato financiero
  await assertFails(batch.commit());
});

// Acepta el alta independiente de un cliente nuevo
test('acepta cliente e identidades desde recepción', async () => {
  // Retira únicamente la preparación del cliente
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    // Obtiene la base aislada
    const database = context.firestore();
    await Promise.all([
      deleteDoc(doc(database, 'clientes', testIds.clientId)),
      deleteDoc(
        doc(database, 'identidadesClientes', 'telefono:9991112233')
      ),
      deleteDoc(
        doc(database, 'identidadesClientes', 'correo:reglas@example.com')
      )
    ]);
  });

  // Construye el alta del directorio
  const context = testEnvironment.authenticatedContext(testIds.userId);
  const database = context.firestore();
  const batch = writeBatch(database);
  const timestamp = serverTimestamp();

  batch.set(
    doc(database, 'clientes', testIds.clientId),
    buildTestClient({ actorUid: testIds.userId, timestamp })
  );
  batch.set(
    doc(database, 'identidadesClientes', 'telefono:9991112233'),
    buildTestIdentity('telefono', '9991112233', {
      actorUid: testIds.userId,
      timestamp
    })
  );
  batch.set(
    doc(database, 'identidadesClientes', 'correo:reglas@example.com'),
    buildTestIdentity('correo', 'reglas@example.com', {
      actorUid: testIds.userId,
      timestamp
    })
  );

  // Comprueba el alta canónica del cliente
  await assertSucceeds(batch.commit());
});

// Rechaza identidades con nombres numéricos
test('rechaza un cliente nuevo con nombre numérico', async () => {
  // Define una identidad aislada
  const clientId = 'cliente_nombre_numerico';
  const phone = '9991112244';
  // Obtiene una sesión de recepción
  const database = testEnvironment
    .authenticatedContext(testIds.userId)
    .firestore();
  // Construye la escritura relacionada
  const batch = writeBatch(database);
  const timestamp = serverTimestamp();

  batch.set(doc(database, 'clientes', clientId), {
    ...buildTestClient({ actorUid: testIds.userId, timestamp }),
    nombreCompleto: '211',
    telefono: phone,
    telefonoNormalizado: phone,
    email: '',
    emailNormalizado: ''
  });
  batch.set(doc(database, 'identidadesClientes', `telefono:${phone}`), {
    ...buildTestIdentity('telefono', phone, {
      actorUid: testIds.userId,
      timestamp
    }),
    clienteId: clientId
  });

  // Comprueba el rechazo atómico
  await assertFails(batch.commit());
});

// Impide escrituras financieras directas
test('rechaza ventas y productos creados desde recepción', async () => {
  // Obtiene una sesión de recepción
  const database = testEnvironment
    .authenticatedContext(testIds.userId)
    .firestore();

  // Comprueba la venta directa
  await assertFails(setDoc(doc(database, 'ventas', 'venta_directa'), {
    totalCentavos: 45000
  }));

  // Comprueba el producto directo
  await assertFails(setDoc(doc(database, 'productos', 'producto_directo'), {
    nombre: 'Producto'
  }));
});

// Rechaza transiciones directas del navegador
test('rechaza en cabina hacia por cobrar sin la función segura', async () => {
  // Prepara una cita existente
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    // Obtiene la base aislada
    const database = context.firestore();
    await setDoc(
      doc(database, 'citas', testIds.appointmentId),
      buildTestAppointment({ state: 'en_cabina' })
    );
    await setDoc(
      doc(database, 'cupos', testIds.slotId),
      buildTestSlot()
    );
  });

  // Construye la transición autorizada
  const database = testEnvironment
    .authenticatedContext(testIds.userId)
    .firestore();
  const batch = writeBatch(database);
  const timestamp = serverTimestamp();
  batch.update(doc(database, 'citas', testIds.appointmentId), {
    estado: 'por_cobrar',
    actualizadaEn: timestamp,
    actualizadaPor: testIds.userId
  });
  batch.set(
    doc(database, 'citas', testIds.appointmentId, 'eventos', 'por_cobrar'),
    {
      tipo: 'cambio_estado',
      estadoAnterior: 'en_cabina',
      estadoNuevo: 'por_cobrar',
      motivo: null,
      actorUid: testIds.userId,
      fecha: timestamp,
      anticipoResultado: null
    }
  );

  // Comprueba el cierre de la escritura directa
  await assertFails(batch.commit());
});

// Bloquea finalizaciones directas
test('rechaza finalizar una cita sin la función segura', async () => {
  // Prepara una cita lista para cobrar
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    // Obtiene la base aislada
    const database = context.firestore();
    await setDoc(
      doc(database, 'citas', testIds.appointmentId),
      buildTestAppointment({ state: 'por_cobrar' })
    );
  });

  // Intenta omitir la función
  const database = testEnvironment
    .authenticatedContext(testIds.userId)
    .firestore();

  // Comprueba el rechazo
  await assertFails(updateDoc(
    doc(database, 'citas', testIds.appointmentId),
    { estado: 'finalizada' }
  ));
});
