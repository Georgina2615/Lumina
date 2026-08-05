import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCabinConsumptionItems } from '../src/modules/clinical/consumption/services/CabinConsumptionPolicy.js';

const supply = {
  id: 'supply_1',
  name: 'Ácido salicílico',
  revision: 2,
  stockScaled: 100_000,
  unit: 'ml'
};

test('convierte mililitros a cantidades enteras', () => {
  const items = buildCabinConsumptionItems([{ quantity: '10.5', supply }]);
  assert.equal(items[0].quantityScaled, 10_500);
});

test('impide usar más cantidad de la disponible', () => {
  assert.throws(() => buildCabinConsumptionItems([{
    quantity: '101',
    supply
  }]), /supera lo disponible/);
});
