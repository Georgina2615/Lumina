import assert from 'node:assert/strict';
import test from 'node:test';
import { runRecordCabinConsumptionTransaction } from '../src/RecordCabinConsumptionTransaction.js';

const buildSnapshot = (reference, data) => ({
  data: () => data,
  exists: data !== undefined,
  id: reference.id
});

const buildFirestore = (seed) => {
  const writes = [];
  const collection = (name) => ({ doc: (id) => ({ id, path: `${name}/${id}` }) });
  const transaction = {
    create: (reference, data) => writes.push({ data, path: reference.path, type: 'create' }),
    getAll: async (...references) => references.map((reference) => buildSnapshot(reference, seed[reference.path])),
    set: (reference, data) => writes.push({ data, path: reference.path, type: 'set' }),
    update: (reference, data) => writes.push({ data, path: reference.path, type: 'update' })
  };
  return {
    firestore: { collection, runTransaction: (callback) => callback(transaction) },
    writes
  };
};

test('descuenta insumos y guarda el consumo de la cita', async () => {
  const { firestore, writes } = buildFirestore({
    'usuarios/actor_1': { activo: true, rol: 'cosmetologa' },
    'citas/appointment_1': { clienteId: 'client_1', estado: 'en_cabina', fecha: '2026-08-05', servicio: 'Limpieza facial' },
    'clientes/client_1': { fusionado: false, nombreCompleto: 'Mariana Escobedo' },
    'consentimientosClinicos/appointment_1': { appointmentId: 'appointment_1', clientId: 'client_1', status: 'signed' },
    'sesionesClinicas/appointment_1': { appointmentId: 'appointment_1', clientId: 'client_1', status: 'completed' },
    'insumosCabina/supply_1': {
      activo: true,
      auditoria: {},
      categoria: 'Activos',
      descripcion: '',
      existenciasEscaladas: 100_000,
      factorEscala: 1000,
      marca: '',
      nombre: 'Ácido salicílico',
      revision: 2,
      schemaVersion: 1,
      stockMinimoEscalado: 10_000,
      sucursalId: 'principal',
      unidad: 'ml'
    },
    'costosInsumosCabina/supply_1': {
      insumoId: 'supply_1',
      schemaVersion: 1,
      sucursalId: 'principal',
      valorInventarioCentavos: 10_000
    }
  });
  const result = await runRecordCabinConsumptionTransaction({
    actorUid: 'actor_1',
    firestore,
    request: {
      appointmentId: 'appointment_1',
      clientId: 'client_1',
      items: [{ expectedRevision: 2, quantityScaled: 10_000, supplyId: 'supply_1' }],
      operationId: 'operation_1'
    },
    requestHash: 'hash_1',
    serverTimestamp: () => 'timestamp'
  });
  assert.equal(result.itemCount, 1);
  assert.equal(writes.find(({ path }) => path === 'insumosCabina/supply_1').data.existenciasEscaladas, 90_000);
  assert.equal(writes.find(({ path }) => path === 'costosInsumosCabina/supply_1').data.valorInventarioCentavos, 9_000);
  assert.equal(writes.find(({ path }) => path === 'consumosCabina/appointment_1').data.status, 'recorded');
  assert.equal(writes.find(({ path }) => path === 'movimientosInsumosCabina/operation_1_0').data.tipo, 'salida_servicio');
});
