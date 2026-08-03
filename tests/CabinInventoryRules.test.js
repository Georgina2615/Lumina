import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const adminUserId = 'admin_reglas_cabina';
const clinicalUserId = 'cosmetologa_reglas_cabina';
const receptionUserId = 'recepcion_reglas_cabina';
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
      setDoc(doc(database, 'usuarios', clinicalUserId), {
        activo: true,
        correo: 'cosmetologa@example.com',
        rol: 'cosmetologa'
      }),
      setDoc(doc(database, 'usuarios', receptionUserId), {
        activo: true,
        correo: 'recepcion@example.com',
        rol: 'recepcion'
      }),
      setDoc(doc(database, 'insumosCabina', 'insumo_activo'), {
        activo: true
      }),
      setDoc(doc(database, 'insumosCabina', 'insumo_inactivo'), {
        activo: false
      }),
      setDoc(doc(database, 'costosInsumosCabina', 'insumo_activo'), {
        valorInventarioCentavos: 5000
      }),
      setDoc(
        doc(database, 'movimientosInsumosCabina', 'movimiento_cabina'),
        { tipo: 'alta' }
      )
    ]);
  });
});

// Libera el entorno aislado
after(async () => {
  await testEnvironment.cleanup();
});

// Protege la lectura operativa de insumos
test('limita insumos según el rol y el estado', async () => {
  const adminDatabase = testEnvironment
    .authenticatedContext(adminUserId)
    .firestore();
  const clinicalDatabase = testEnvironment
    .authenticatedContext(clinicalUserId)
    .firestore();
  const receptionDatabase = testEnvironment
    .authenticatedContext(receptionUserId)
    .firestore();

  await assertSucceeds(getDoc(
    doc(adminDatabase, 'insumosCabina', 'insumo_inactivo')
  ));
  await assertSucceeds(getDoc(
    doc(clinicalDatabase, 'insumosCabina', 'insumo_activo')
  ));
  await assertFails(getDoc(
    doc(clinicalDatabase, 'insumosCabina', 'insumo_inactivo')
  ));
  await assertFails(getDoc(
    doc(receptionDatabase, 'insumosCabina', 'insumo_activo')
  ));
});

// Protege la información privada de cabina
test('reserva costos y movimientos para administración', async () => {
  const adminDatabase = testEnvironment
    .authenticatedContext(adminUserId)
    .firestore();
  const clinicalDatabase = testEnvironment
    .authenticatedContext(clinicalUserId)
    .firestore();
  const receptionDatabase = testEnvironment
    .authenticatedContext(receptionUserId)
    .firestore();

  await assertSucceeds(getDoc(
    doc(adminDatabase, 'costosInsumosCabina', 'insumo_activo')
  ));
  await assertSucceeds(getDoc(
    doc(adminDatabase, 'movimientosInsumosCabina', 'movimiento_cabina')
  ));
  await assertFails(getDoc(
    doc(clinicalDatabase, 'costosInsumosCabina', 'insumo_activo')
  ));
  await assertFails(getDoc(
    doc(receptionDatabase, 'movimientosInsumosCabina', 'movimiento_cabina')
  ));
});

// Bloquea escrituras directas de todos los roles
test('rechaza escrituras directas sobre las tres colecciones', async () => {
  const userIds = [adminUserId, clinicalUserId, receptionUserId];
  const collections = [
    'insumosCabina',
    'costosInsumosCabina',
    'movimientosInsumosCabina'
  ];

  for (const userId of userIds) {
    const database = testEnvironment.authenticatedContext(userId).firestore();
    for (const collectionName of collections) {
      await assertFails(setDoc(
        doc(database, collectionName, `directo_${userId}`),
        { activo: true }
      ));
    }
  }
});
