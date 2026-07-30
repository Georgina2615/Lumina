import { createHash } from 'node:crypto';

// Resume valores con un algoritmo estable
const hashValue = (value) => (
  createHash('sha256').update(value).digest('hex')
);

// Construye identificadores estables sin contadores
export const buildSaleIdentifiers = (request) => {
  // Define un identificador único por origen
  const saleId = request.appointmentId
    ? `cita_${request.appointmentId}`
    : `mostrador_${request.idempotencyKey}`;

  // Resume el identificador para mostrarlo
  const folioHash = hashValue(saleId).slice(0, 12).toUpperCase();

  // Devuelve los identificadores canónicos
  return { saleId, folio: `LS-${folioHash}` };
};

// Protege la reutilización de una clave con datos diferentes
export const buildRequestHash = (request) => hashValue(JSON.stringify({
  appointmentId: request.appointmentId,
  clientId: request.clientId,
  idempotencyKey: request.idempotencyKey,
  payments: request.payments,
  productItems: request.productItems,
  receiptEmail: request.receiptEmail
}));

// Construye identificadores de pagos deterministas
export const buildDepositPaymentId = (appointmentId) => (
  `${appointmentId}_anticipo`
);

// Construye identificadores de liquidación
export const buildCheckoutPaymentId = (saleId, index) => (
  `${saleId}_liquidacion_${index}`
);

// Construye identificadores de movimientos
export const buildInventoryMovementId = (saleId, productId) => (
  `${saleId}_${productId}`
);
