import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCabinConsumptionRequest } from '../src/CabinConsumptionPolicy.js';

const buildRequest = (overrides = {}) => ({
  appointmentId: 'appointment_1',
  clientId: 'client_1',
  items: [{ expectedRevision: 2, quantityScaled: 10_000, supplyId: 'supply_1' }],
  operationId: 'operation_1',
  ...overrides
});

test('normaliza un consumo con cantidades enteras', () => {
  const request = validateCabinConsumptionRequest(buildRequest());
  assert.equal(request.items[0].quantityScaled, 10_000);
});

test('rechaza insumos repetidos', () => {
  const item = buildRequest().items[0];
  assert.throws(() => validateCabinConsumptionRequest(buildRequest({
    items: [item, item]
  })), /una sola vez/);
});

test('rechaza cantidades negativas o vacías', () => {
  assert.throws(() => validateCabinConsumptionRequest(buildRequest({
    items: [{ expectedRevision: 2, quantityScaled: 0, supplyId: 'supply_1' }]
  })), /cantidad utilizada/);
});
