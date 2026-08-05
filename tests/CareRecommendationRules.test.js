import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const users = {
  admin: 'admin_recommendations',
  clinical: 'clinical_recommendations',
  reception: 'reception_recommendations'
};
let testEnvironment;

// Carga las reglas locales
before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8');
  testEnvironment = await initializeTestEnvironment({ projectId: 'demo-lumina', firestore: { rules } });
});

// Prepara datos aislados de autorización
beforeEach(async () => {
  await testEnvironment.clearFirestore();
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore();
    await Promise.all([
      ...Object.entries(users).map(([role, id]) => setDoc(doc(database, 'usuarios', id), {
        activo: true,
        correo: `${role}@example.com`,
        rol: role === 'clinical' ? 'cosmetologa' : role === 'reception' ? 'recepcion' : role
      })),
      setDoc(doc(database, 'productos', 'product_active'), { activo: true, nombre: 'Protector' }),
      setDoc(doc(database, 'productos', 'product_inactive'), { activo: false, nombre: 'Oculto' }),
      setDoc(doc(database, 'recomendacionesCuidado', 'appointment_1'), {
        appointmentId: 'appointment_1',
        clientId: 'client_1'
      })
    ]);
  });
});

// Libera el entorno aislado
after(async () => {
  await testEnvironment.cleanup();
});

test('permite consultar recomendaciones al personal activo', async () => {
  for (const id of Object.values(users)) {
    const database = testEnvironment.authenticatedContext(id).firestore();
    await assertSucceeds(getDoc(doc(database, 'recomendacionesCuidado', 'appointment_1')));
  }
});

test('limita el catálogo clínico a productos activos', async () => {
  const database = testEnvironment.authenticatedContext(users.clinical).firestore();
  await assertSucceeds(getDocs(query(collection(database, 'productos'), where('activo', '==', true))));
  await assertFails(getDoc(doc(database, 'productos', 'product_inactive')));
});

test('impide escribir recomendaciones desde el navegador', async () => {
  const database = testEnvironment.authenticatedContext(users.clinical).firestore();
  await assertFails(setDoc(doc(database, 'recomendacionesCuidado', 'appointment_2'), {
    appointmentId: 'appointment_2'
  }));
});
