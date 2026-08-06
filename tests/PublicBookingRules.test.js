import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Conserva el entorno aislado de reglas
let testEnvironment;
const receptionId = 'recepcion_solicitudes_publicas';
const clinicalId = 'cosmetologa_solicitudes_publicas';

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

// Prepara documentos exclusivos del emulador
beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await Promise.all([
      setDoc(doc(database, 'usuarios', receptionId), {
        activo: true,
        correo: 'recepcion@example.com',
        rol: 'recepcion'
      }),
      setDoc(doc(database, 'usuarios', clinicalId), {
        activo: true,
        correo: 'cosmetologa@example.com',
        rol: 'cosmetologa'
      }),
      setDoc(doc(database, 'configuracionPublica', 'pagos'), {
        active: true,
        bankName: 'Institucion de prueba',
        beneficiaryName: 'Titular de prueba',
        clabe: '000000000000000000'
      }),
      setDoc(doc(database, 'solicitudesCitaPublica', 'solicitud_1'), {
        status: 'pending_review'
      }),
      setDoc(doc(database, 'reservasPublicas', '2030-07-01_10:00'), {
        status: 'pending_review'
      }),
      setDoc(
        doc(database, 'solicitudesCitaPublica', 'control', 'contactos', 'hash'),
        { active: true }
      )
    ]);
  });
});

// Libera el entorno aislado
after(async () => {
  await testEnvironment.cleanup();
});

// Permite leer solamente la configuracion publica activa
test('permite consultar los datos publicos de transferencia', async () => {
  const database = testEnvironment.unauthenticatedContext().firestore();
  await assertSucceeds(getDoc(doc(database, 'configuracionPublica', 'pagos')));
  await assertFails(getDoc(doc(database, 'configuracionPublica', 'otro')));
  await assertFails(setDoc(doc(database, 'configuracionPublica', 'pagos'), {
    active: true
  }));
});

// Protege solicitudes horarios y bloqueos de contacto
test('limita la revision de solicitudes a recepcion', async () => {
  const publicDatabase = testEnvironment.unauthenticatedContext().firestore();
  const clinicalDatabase = testEnvironment
    .authenticatedContext(clinicalId)
    .firestore();
  const receptionDatabase = testEnvironment
    .authenticatedContext(receptionId)
    .firestore();

  await assertFails(getDoc(doc(
    publicDatabase,
    'solicitudesCitaPublica',
    'solicitud_1'
  )));
  await assertFails(getDoc(doc(
    clinicalDatabase,
    'solicitudesCitaPublica',
    'solicitud_1'
  )));
  await assertSucceeds(getDoc(doc(
    receptionDatabase,
    'solicitudesCitaPublica',
    'solicitud_1'
  )));
  await assertSucceeds(getDoc(doc(
    receptionDatabase,
    'reservasPublicas',
    '2030-07-01_10:00'
  )));
  await assertFails(getDoc(doc(
    receptionDatabase,
    'solicitudesCitaPublica',
    'control',
    'contactos',
    'hash'
  )));
});

// Impide cambios directos incluso al personal
test('rechaza cambios directos en solicitudes y reservas', async () => {
  const database = testEnvironment
    .authenticatedContext(receptionId)
    .firestore();
  await assertFails(updateDoc(doc(
    database,
    'solicitudesCitaPublica',
    'solicitud_1'
  ), { status: 'approved' }));
  await assertFails(updateDoc(doc(
    database,
    'reservasPublicas',
    '2030-07-01_10:00'
  ), { status: 'approved' }));
});
