import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterClinicalDirectory,
  mapClinicalDirectoryEntry,
  sortClinicalDirectory
} from '../src/modules/clinical/records/services/ClinicalDirectoryPolicy.js';

const createClientSnapshot = (id, data) => ({ data: () => data, id });

// Verifica la unión segura de clientes y fichas
test('mapClinicalDirectoryEntry accepts only the matching record', () => {
  const snapshot = createClientSnapshot('client-1', {
    consentimientoFirmado: true,
    email: 'ana@example.com',
    nombreCompleto: 'Ana Pérez',
    telefono: '9810000000'
  });
  const entry = mapClinicalDirectoryEntry(snapshot, new Map([['client-1', {
    clientId: 'client-1',
    revision: 2,
    schemaVersion: 1,
    status: 'completed'
  }]]));

  assert.equal(entry.status, 'completed');
  assert.equal(entry.revision, 2);
  assert.equal(entry.client.consentSigned, true);
});

// Verifica búsquedas parciales sin distinguir acentos
test('filterClinicalDirectory finds partial normalized contact data', () => {
  const entries = [
    { client: { email: 'ana@example.com', name: 'Ángela Rosado', phone: '9811234567' } },
    { client: { email: 'maria@example.com', name: 'María López', phone: '9817654321' } }
  ];

  assert.equal(filterClinicalDirectory(entries, 'ange').length, 1);
  assert.equal(filterClinicalDirectory(entries, '7654')[0].client.name, 'María López');
  assert.equal(filterClinicalDirectory(entries, 'EXAMPLE.COM').length, 2);
});

// Verifica el orden alfabético estable del directorio
test('sortClinicalDirectory orders names for Spanish readers', () => {
  const entries = [
    { client: { name: 'Zoé' } },
    { client: { name: 'Ángela' } }
  ];

  assert.deepEqual(
    sortClinicalDirectory(entries).map(({ client }) => client.name),
    ['Ángela', 'Zoé']
  );
});
