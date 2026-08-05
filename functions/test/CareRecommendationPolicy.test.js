import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCareRecommendationRequest } from '../src/CareRecommendationPolicy.js';

const buildRequest = (overrides = {}) => ({
  appointmentId: 'appointment_1',
  clientId: 'client_1',
  expectedRevision: 0,
  operationId: 'operation_1',
  recommendation: {
    careInstructions: '  Usar protector solar todos los días  ',
    nextVisitDate: '2026-09-05',
    productIds: ['product_2', 'product_1'],
    serviceId: 'service_1'
  },
  ...overrides
});

test('normaliza una recomendación estética completa', () => {
  const request = validateCareRecommendationRequest(buildRequest());
  assert.equal(request.recommendation.careInstructions, 'Usar protector solar todos los días');
  assert.deepEqual(request.recommendation.productIds, ['product_1', 'product_2']);
});

test('rechaza recomendaciones completamente vacías', () => {
  assert.throws(() => validateCareRecommendationRequest(buildRequest({
    recommendation: {
      careInstructions: '',
      nextVisitDate: '',
      productIds: [],
      serviceId: ''
    }
  })), /al menos una recomendación/);
});

test('rechaza productos repetidos y fechas imposibles', () => {
  assert.throws(() => validateCareRecommendationRequest(buildRequest({
    recommendation: {
      ...buildRequest().recommendation,
      productIds: ['product_1', 'product_1']
    }
  })), /una sola vez/);
  assert.throws(() => validateCareRecommendationRequest(buildRequest({
    recommendation: {
      ...buildRequest().recommendation,
      nextVisitDate: '2026-02-31'
    }
  })), /fecha sugerida/);
});
