import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const adminUserId = 'admin_reglas_corte';
const receptionUserId = 'recepcion_reglas_corte';
const clinicalUserId = 'cosmetologa_reglas_corte';
let testEnvironment;

// Carga las reglas locales
before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnvironment = await initializeTestEnvironment({
    projectId: 'demo-lumina',
    firestore: { rules }
  });
});

// Prepara usuarios y cortes aislados
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
      setDoc(doc(database, 'cortesCaja', '2026-08-03'), {
        fecha: '2026-08-03',
        schemaVersion: 1
      }),
      setDoc(doc(database, 'cambiosCortesCaja', 'cambio_1'), {
        accion: 'close',
        fecha: '2026-08-03'
      })
    ]);
  });
});

// Libera el entorno aislado
after(async () => {
  await testEnvironment.cleanup();
});

// Reserva la lectura de cortes para administracion
test('permite leer cortes e historial solo a administracion', async () => {
  const adminDatabase = testEnvironment.authenticatedContext(adminUserId).firestore();
  await assertSucceeds(getDoc(doc(adminDatabase, 'cortesCaja', '2026-08-03')));
  await assertSucceeds(getDoc(doc(adminDatabase, 'cambiosCortesCaja', 'cambio_1')));

  const blockedContexts = [
    testEnvironment.authenticatedContext(receptionUserId),
    testEnvironment.authenticatedContext(clinicalUserId),
    testEnvironment.unauthenticatedContext()
  ];

  for (const context of blockedContexts) {
    const database = context.firestore();
    await assertFails(getDoc(doc(database, 'cortesCaja', '2026-08-03')));
    await assertFails(getDoc(doc(database, 'cambiosCortesCaja', 'cambio_1')));
  }
});

// Bloquea cambios directos desde el navegador
test('rechaza escrituras directas sobre cortes e historial', async () => {
  const contexts = [
    testEnvironment.authenticatedContext(adminUserId),
    testEnvironment.authenticatedContext(receptionUserId),
    testEnvironment.unauthenticatedContext()
  ];

  for (const context of contexts) {
    const database = context.firestore();
    await assertFails(setDoc(doc(database, 'cortesCaja', '2026-08-02'), {
      fecha: '2026-08-02'
    }));
    await assertFails(updateDoc(doc(database, 'cortesCaja', '2026-08-03'), {
      revision: 2
    }));
    await assertFails(deleteDoc(doc(database, 'cortesCaja', '2026-08-03')));
    await assertFails(setDoc(doc(database, 'cambiosCortesCaja', 'directo'), {
      accion: 'correct'
    }));
  }
});
