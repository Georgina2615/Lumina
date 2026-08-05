import assert from 'node:assert/strict';
import test from 'node:test';
import { runManageCareRecommendationTransaction } from '../src/ManageCareRecommendationTransaction.js';

const buildSnapshot = (reference, data) => ({
  data: () => data,
  exists: data !== undefined,
  id: reference.id
});

const buildFirestore = (seed) => {
  const writes = [];
  const collection = (name) => ({ doc: (id) => ({ id, path: `${name}/${id}` }) });
  const transaction = {
    getAll: async (...references) => references.map((reference) => buildSnapshot(reference, seed[reference.path])),
    set: (reference, data) => writes.push({ data, path: reference.path })
  };
  return {
    firestore: { collection, runTransaction: (callback) => callback(transaction) },
    writes
  };
};

test('guarda productos y tratamiento como fotografías históricas', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/actor_1': { activo: true, rol: 'cosmetologa' },
    'citas/appointment_1': { clienteId: 'client_1', estado: 'en_cabina', fecha: '2026-08-05', servicio: 'Limpieza facial' },
    'clientes/client_1': { fusionado: false },
    'sesionesClinicas/appointment_1': { clientId: 'client_1', status: 'completed' },
    'productos/product_1': { activo: true, marca: 'Lumina', nombre: 'Protector solar', precioCentavos: 40000 },
    'servicios/service_1': { activo: true, nombre: 'Anti edad', precioCentavos: 65000 }
  });
  const result = await runManageCareRecommendationTransaction({
    actorUid: 'actor_1',
    firestore,
    request: {
      appointmentId: 'appointment_1',
      clientId: 'client_1',
      expectedRevision: 0,
      operationId: 'operation_1',
      recommendation: {
        careInstructions: 'Usar protector solar',
        nextVisitDate: '2026-09-05',
        productIds: ['product_1'],
        serviceId: 'service_1'
      }
    },
    requestHash: 'hash_1',
    serverTimestamp: () => 'timestamp'
  });
  const document = writes.find(({ path }) => path === 'recomendacionesCuidado/appointment_1').data;
  assert.equal(result.revision, 1);
  assert.equal(document.products[0].name, 'Protector solar');
  assert.equal(document.recommendedService.name, 'Anti edad');
  assert.equal(document.updatedBy, 'actor_1');
});
