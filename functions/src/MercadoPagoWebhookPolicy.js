import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

// Extrae una parte de la firma recibida
const getSignaturePart = (signature, name) => String(signature ?? '')
  .split(',')
  .map((part) => part.trim().split('='))
  .find(([key]) => key === name)?.[1] ?? '';

// Compara firmas sin revelar diferencias temporales
export const hasValidMercadoPagoSignature = ({
  dataId,
  requestId,
  secret,
  signature
}) => {
  const timestamp = getSignaturePart(signature, 'ts');
  const receivedHash = getSignaturePart(signature, 'v1');
  if (!dataId || !requestId || !secret || !timestamp || !receivedHash) {
    return false;
  }

  const manifest = `id:${String(dataId).toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac('sha256', secret)
    .update(manifest)
    .digest('hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const receivedBuffer = Buffer.from(receivedHash, 'hex');

  return expectedBuffer.length === receivedBuffer.length
    && timingSafeEqual(expectedBuffer, receivedBuffer);
};

// Obtiene el identificador aceptado por el webhook
export const getMercadoPagoNotificationId = (request) => (
  String(request.query?.['data.id'] ?? request.body?.data?.id ?? '').trim()
);
