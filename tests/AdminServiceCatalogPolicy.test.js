import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildServiceCommand,
  createServiceFormState,
  isServiceCatalogDocumentValid,
  parseServicePriceCents,
  validateServiceForm
} from '../src/modules/admin/settings/catalog/services/AdminServiceCatalogPolicy.js';

// Construye un formulario valido
const buildForm = (overrides = {}) => ({
  name: 'Vitamina C 10',
  publicDescription: 'Ayuda a mejorar la luminosidad',
  price: '500',
  ...overrides
});

// Construye un documento de servicio
const buildServiceDocument = (overrides = {}) => ({
  activo: true,
  duracionBloqueMinutos: 180,
  duracionServicioMinutos: 150,
  nombre: 'Limpieza facial profunda',
  orden: 1,
  porcentajeAnticipo: 30,
  precioCentavos: 45_000,
  tiempoPreparacionMinutos: 30,
  ...overrides
});

test('convierte pesos visibles en centavos enteros', () => {
  assert.equal(parseServicePriceCents('450.50'), 45_050);
  assert.equal(parseServicePriceCents('0'), null);
  assert.equal(parseServicePriceCents('1000000.01'), null);
});

test('permite numeros dentro de nombres validos', () => {
  assert.equal(validateServiceForm(buildForm()), null);
  assert.equal(buildServiceCommand(buildForm()).name, 'Vitamina C 10');
  assert.equal('order' in buildServiceCommand(buildForm()), false);
});

test('rechaza nombre precio y descripcion invalidos', () => {
  assert.match(validateServiceForm(buildForm({ name: '123' })), /nombre/);
  assert.match(validateServiceForm(buildForm({ name: '---' })), /nombre/);
  assert.match(validateServiceForm(buildForm({ price: '0' })), /precio/);
  assert.match(validateServiceForm(buildForm({
    publicDescription: 'a'.repeat(501)
  })), /descripción/);
});

test('interpreta documentos heredados sin descripcion', () => {
  const form = createServiceFormState({
    name: 'Anti edad',
    priceCents: 65_000
  });

  assert.equal(form.publicDescription, '');
  assert.equal(form.price, '650');
});

test('distingue servicios operativos de documentos incompletos', () => {
  const validService = buildServiceDocument();
  const invalidService = buildServiceDocument({
    nombre: '211'
  });

  assert.equal(isServiceCatalogDocumentValid(validService), true);
  assert.equal(isServiceCatalogDocumentValid(invalidService), false);
});
