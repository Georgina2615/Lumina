import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import {
  getMercadoPagoNotificationId,
  hasValidMercadoPagoSignature
} from '../src/MercadoPagoWebhookPolicy.js';

// Construye una firma como la enviada por el proveedor
const buildSignature = ({ dataId, requestId, secret, timestamp }) => {
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const hash = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${timestamp},v1=${hash}`;
};

// Acepta una notificación firmada completa
test('valida la firma autentica de Mercado Pago', () => {
  const values = {
    dataId: '123456',
    requestId: 'request-1',
    secret: 'firma-privada',
    timestamp: '1704908010'
  };

  assert.equal(hasValidMercadoPagoSignature({
    ...values,
    signature: buildSignature(values)
  }), true);
});

// Rechaza cambios en el identificador firmado
test('rechaza una notificación alterada', () => {
  const values = {
    dataId: '123456',
    requestId: 'request-1',
    secret: 'firma-privada',
    timestamp: '1704908010'
  };

  assert.equal(hasValidMercadoPagoSignature({
    ...values,
    dataId: '654321',
    signature: buildSignature(values)
  }), false);
});

// Prioriza el identificador de la dirección oficial
test('obtiene el pago indicado por la notificación', () => {
  assert.equal(getMercadoPagoNotificationId({
    query: { 'data.id': '123456' },
    body: { data: { id: '999999' } }
  }), '123456');
});
