import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';

// Define identidades aisladas para disponibilidad
const adminUserId = 'admin_reglas_disponibilidad';
const receptionUserId = 'recepcion_reglas_disponibilidad';
const clinicalUserId = 'cosmetologa_reglas_disponibilidad';
const inactiveUserId = 'inactiva_reglas_disponibilidad';
const activeUserIds = [adminUserId, receptionUserId, clinicalUserId];
let testEnvironment;

// Carga las reglas locales
before(async () => {
  const rules = await readFile(
    new URL('../firestore.rules', import.meta.url),
    'utf8'
  );

  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-lumina',
    firestore: { rules }
  });
});

// Prepara usuarios y documentos aislados
beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();

    await Promise.all([
      setDoc(doc(database, 'usuarios', adminUserId), {
        activo: true,
        correo: 'admin@example.com',
        rol: 'admin'
      }),
      setDoc(doc(database, 'usuarios', receptionUserId), {
        activo: true,
        correo: 'recepcion@example.com',
        rol: 'recepcion'
      }),
      setDoc(doc(database, 'usuarios', clinicalUserId), {
        activo: true,
        correo: 'cosmetologa@example.com',
        rol: 'cosmetologa'
      }),
      setDoc(doc(database, 'usuarios', inactiveUserId), {
        activo: false,
        correo: 'inactiva@example.com',
        rol: 'admin'
      }),
      setDoc(doc(database, 'cupos', '2030-08-10_10:00'), {
        fecha: '2030-08-10',
        hora: '10:00',
        tipo: 'bloqueo_admin'
      }),
      setDoc(doc(database, 'cambiosDisponibilidad', 'cambio_1'), {
        accion: 'bloquear',
        actorUid: adminUserId,
        slotId: '2030-08-10_10:00'
      })
    ]);
  });
});

// Libera el entorno aislado
after(async () => {
  await testEnvironment.cleanup();
});

// Permite consultar cupos al personal activo
test('permite leer cupos al personal activo', async () => {
  for (const userId of activeUserIds) {
    const database = testEnvironment.authenticatedContext(userId).firestore();
    await assertSucceeds(getDoc(
      doc(database, 'cupos', '2030-08-10_10:00')
    ));
  }

  const inactiveDatabase = testEnvironment
    .authenticatedContext(inactiveUserId)
    .firestore();
  const anonymousDatabase = testEnvironment.unauthenticatedContext().firestore();

  await assertFails(getDoc(
    doc(inactiveDatabase, 'cupos', '2030-08-10_10:00')
  ));
  await assertFails(getDoc(
    doc(anonymousDatabase, 'cupos', '2030-08-10_10:00')
  ));
});

// Reserva el historial para administracion
test('permite leer cambios de disponibilidad solo a administracion', async () => {
  const adminDatabase = testEnvironment
    .authenticatedContext(adminUserId)
    .firestore();

  await assertSucceeds(getDoc(
    doc(adminDatabase, 'cambiosDisponibilidad', 'cambio_1')
  ));

  const blockedContexts = [
    testEnvironment.authenticatedContext(receptionUserId),
    testEnvironment.authenticatedContext(clinicalUserId),
    testEnvironment.authenticatedContext(inactiveUserId),
    testEnvironment.unauthenticatedContext()
  ];

  for (const context of blockedContexts) {
    const database = context.firestore();
    await assertFails(getDoc(
      doc(database, 'cambiosDisponibilidad', 'cambio_1')
    ));
  }
});

// Bloquea escrituras directas desde cualquier sesion
test('rechaza escrituras directas sobre cupos e historial', async () => {
  const browserContexts = [
    ...activeUserIds.map((userId) => (
      testEnvironment.authenticatedContext(userId)
    )),
    testEnvironment.authenticatedContext(inactiveUserId),
    testEnvironment.unauthenticatedContext()
  ];

  for (const context of browserContexts) {
    const database = context.firestore();

    await assertFails(setDoc(doc(database, 'cupos', 'cupo_directo'), {
      estado: 'bloqueado'
    }));
    await assertFails(updateDoc(
      doc(database, 'cupos', '2030-08-10_10:00'),
      { estado: 'disponible' }
    ));
    await assertFails(deleteDoc(
      doc(database, 'cupos', '2030-08-10_10:00')
    ));
    await assertFails(setDoc(
      doc(database, 'cambiosDisponibilidad', 'cambio_directo'),
      { accion: 'bloquear' }
    ));
    await assertFails(updateDoc(
      doc(database, 'cambiosDisponibilidad', 'cambio_1'),
      { accion: 'reabrir' }
    ));
    await assertFails(deleteDoc(
      doc(database, 'cambiosDisponibilidad', 'cambio_1')
    ));
  }
});
