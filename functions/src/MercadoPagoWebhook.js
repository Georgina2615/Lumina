import { logger } from 'firebase-functions';
import { finalizePublicPayment } from './FinalizePublicPayment.js';
import { getMercadoPagoPayment } from './MercadoPagoClient.js';
import {
  getMercadoPagoNotificationId,
  hasValidMercadoPagoSignature
} from './MercadoPagoWebhookPolicy.js';

// Atiende una notificación firmada del proveedor
export const mercadoPagoWebhookHandler = async ({
  accessToken,
  firestore,
  request,
  response,
  webhookSecret
}) => {
  const paymentId = getMercadoPagoNotificationId(request);
  const validSignature = hasValidMercadoPagoSignature({
    dataId: request.query?.['data.id'] ?? paymentId,
    requestId: request.get('x-request-id'),
    secret: webhookSecret,
    signature: request.get('x-signature')
  });
  if (!validSignature) {
    response.sendStatus(401);
    return;
  }

  try {
    const payment = await getMercadoPagoPayment({ accessToken, paymentId });
    if (payment.status === 'approved' && payment.external_reference) {
      await finalizePublicPayment({
        firestore,
        payment,
        sessionId: String(payment.external_reference)
      });
    }
    response.sendStatus(200);
  } catch (error) {
    logger.error('No se pudo procesar la notificación de Mercado Pago', {
      errorName: error?.name ?? 'Error',
      paymentId
    });
    response.sendStatus(500);
  }
};
