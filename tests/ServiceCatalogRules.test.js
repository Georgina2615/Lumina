import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

const adminUserId = 'admin_reglas_servicios';
const receptionUserId = 'recepcion_reglas_servicios';
const clinicalUserId = 'cosmetologa_reglas_servicios';
const inactiveUserId = 'admin_inactiva_reglas_servicios';
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

// Prepara identidades y documentos aislados
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
      setDoc(doc(database, 'servicios', 'limpieza'), {
        activo: true,
        nombre: 'Limpieza facial profunda',
        precioCentavos: 45_000
      }),
      setDoc(doc(database, 'servicios', 'oculto'), {
        activo: false,
        nombre: 'Servicio en preparación',
        precioCentavos: 35_000
      }),
      setDoc(doc(database, 'cambiosServicios', 'cambio_1'), {
        accion: 'update',
        actorUid: adminUserId,
        servicioId: 'limpieza'
      })
    ]);
  });
});

// Libera el entorno aislado
after(async () => {
  await testEnvironment.cleanup();
});

// Permite consultar el catalogo completo al personal activo
test('permite leer servicios a los tres roles', async () => {
  const userIds = [adminUserId, receptionUserId, clinicalUserId];

  for (const userId of userIds) {
    const database = testEnvironment.authenticatedContext(userId).firestore();
    await assertSucceeds(getDoc(doc(database, 'servicios', 'limpieza')));
    await assertSucceeds(getDocs(collection(database, 'servicios')));
  }

});

// Limita la lectura publica a servicios activos
test('permite al publico consultar solo servicios activos', async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();
  const activeServices = query(
    collection(database, 'servicios'),
    where('activo', '==', true)
  );

  await assertSucceeds(getDocs(activeServices));
  await assertSucceeds(getDoc(doc(database, 'servicios', 'limpieza')));
  await assertFails(getDoc(doc(database, 'servicios', 'oculto')));
  await assertFails(getDocs(collection(database, 'servicios')));
});

// Bloquea cambios directos aunque la sesion sea administrativa
test('rechaza crear editar o eliminar servicios desde el navegador', async () => {
  const database = testEnvironment
    .authenticatedContext(adminUserId)
    .firestore();

  await assertFails(setDoc(doc(database, 'servicios', 'nuevo'), {
    activo: true,
    nombre: 'Nuevo servicio'
  }));
  await assertFails(updateDoc(doc(database, 'servicios', 'limpieza'), {
    precioCentavos: 1
  }));
  await assertFails(deleteDoc(doc(database, 'servicios', 'limpieza')));
});

// Reserva el historial para administracion
test('protege el historial privado de servicios', async () => {
  const adminDatabase = testEnvironment
    .authenticatedContext(adminUserId)
    .firestore();
  const receptionDatabase = testEnvironment
    .authenticatedContext(receptionUserId)
    .firestore();

  await assertSucceeds(getDoc(
    doc(adminDatabase, 'cambiosServicios', 'cambio_1')
  ));
  await assertFails(getDoc(
    doc(receptionDatabase, 'cambiosServicios', 'cambio_1')
  ));
  await assertFails(setDoc(
    doc(adminDatabase, 'cambiosServicios', 'directo'),
    { accion: 'update' }
  ));
});
