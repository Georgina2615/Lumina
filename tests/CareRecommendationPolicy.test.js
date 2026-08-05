import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildCareRecommendationPayload,
  filterRecommendationProducts
} from '../src/modules/clinical/recommendations/services/CareRecommendationPolicy.js';

test('encuentra productos por nombre marca o categoría', () => {
  const products = [
    { brand: 'Lumina', category: 'Protector solar', name: 'Fluido diario' },
    { brand: 'Otra', category: 'Limpieza', name: 'Gel facial' }
  ];
  assert.equal(filterRecommendationProducts(products, 'solar')[0].name, 'Fluido diario');
  assert.equal(filterRecommendationProducts(products, 'otra')[0].name, 'Gel facial');
});

test('construye productos ordenados y texto normalizado', () => {
  const result = buildCareRecommendationPayload({
    fields: {
      careInstructions: '  Limpiar   dos veces al día ',
      nextVisitDate: '',
      serviceId: ''
    },
    selectedProductIds: ['product_2', 'product_1']
  });
  assert.equal(result.careInstructions, 'Limpiar dos veces al día');
  assert.deepEqual(result.productIds, ['product_1', 'product_2']);
});

test('impide guardar una recomendación vacía', () => {
  assert.throws(() => buildCareRecommendationPayload({
    fields: { careInstructions: '', nextVisitDate: '', serviceId: '' },
    selectedProductIds: []
  }), /al menos una recomendación/);
});
