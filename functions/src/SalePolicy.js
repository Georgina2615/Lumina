import { SaleError } from './SaleError.js';
import { normalizePayments } from './SalePaymentPolicy.js';

// Define el máximo de productos distintos
const MAX_PRODUCT_LINES = 50;

// Define el máximo de unidades por producto
const MAX_PRODUCT_QUANTITY = 99;

// Define el formato permitido para documentos
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]+$/;

// Define el formato permitido para operaciones
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9_-]{16,100}$/;

// Define el máximo permitido para correos
const MAX_EMAIL_LENGTH = 254;

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new SaleError(code, message);
};

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Rechaza propiedades fuera del contrato
const assertAllowedKeys = (value, allowedKeys, label) => {
  // Busca la primera propiedad desconocida
  const invalidKey = Object.keys(value).find(
    (key) => !allowedKeys.includes(key)
  );

  // Detiene contratos con información adicional
  if (invalidKey) {
    fail('invalid-argument', `${label} contiene campos no permitidos`);
  }
};

// Normaliza identificadores de documentos
const normalizeDocumentId = (value, label, optional = false) => {
  // Permite ausencia solo cuando el campo es opcional
  if (optional && (value === null || value === undefined || value === '')) {
    // Devuelve una ausencia canónica
    return null;
  }

  // Detiene identificadores inseguros
  if (
    typeof value !== 'string'
    || value.length > 150
    || !IDENTIFIER_PATTERN.test(value)
  ) {
    fail('invalid-argument', `${label} no es válido`);
  }

  // Devuelve el identificador validado
  return value;
};

// Normaliza el correo opcional del comprobante
const normalizeReceiptEmail = (value) => {
  // Permite la ausencia del correo
  if (value === null || value === undefined || value === '') {
    // Devuelve una ausencia canónica
    return '';
  }

  // Detiene valores que no son texto
  if (typeof value !== 'string') {
    fail('invalid-argument', 'El correo del comprobante no es válido');
  }

  // Limpia y normaliza el correo recibido
  const normalized = value.trim().toLowerCase();

  // Separa el correo para validar sus límites
  const separatorIndex = normalized.lastIndexOf('@');

  // Detiene correos inseguros o incompletos
  if (
    normalized.length > MAX_EMAIL_LENGTH
    || separatorIndex < 1
    || separatorIndex > 64
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    fail('invalid-argument', 'El correo del comprobante no es válido');
  }

  // Devuelve el correo canónico
  return normalized;
};

// Normaliza los productos solicitados
const normalizeProductItems = (productItems) => {
  // Detiene arreglos inválidos o excesivos
  if (!Array.isArray(productItems) || productItems.length > MAX_PRODUCT_LINES) {
    fail('invalid-argument', 'Los productos de la venta no son válidos');
  }

  // Conserva identificadores ya utilizados
  const seenIds = new Set();

  // Normaliza cada producto solicitado
  const normalized = productItems.map((item) => {
    // Detiene entradas que no son objetos
    if (!isRecord(item)) {
      fail('invalid-argument', 'Un producto de la venta no es válido');
    }

    // Limita el contrato de cada producto
    assertAllowedKeys(item, ['productId', 'quantity'], 'El producto');

    // Normaliza el identificador del producto
    const productId = normalizeDocumentId(item.productId, 'El producto');

    // Detiene cantidades inseguras o duplicadas
    if (
      !Number.isSafeInteger(item.quantity)
      || item.quantity < 1
      || item.quantity > MAX_PRODUCT_QUANTITY
      || seenIds.has(productId)
    ) {
      fail('invalid-argument', 'La cantidad del producto no es válida');
    }

    // Registra el producto para impedir duplicados
    seenIds.add(productId);

    // Devuelve el producto normalizado
    return { productId, quantity: item.quantity };
  });

  // Devuelve un orden estable para la idempotencia
  return normalized.sort(
    (first, second) => first.productId.localeCompare(second.productId)
  );
};

// Valida y normaliza el contrato público
export const validateSaleRequest = (data) => {
  // Detiene solicitudes sin un objeto válido
  if (!isRecord(data)) {
    fail('invalid-argument', 'La solicitud de cobro no es válida');
  }

  // Limita los campos aceptados
  assertAllowedKeys(data, [
    'appointmentId',
    'clientId',
    'idempotencyKey',
    'payments',
    'productItems',
    'receiptEmail'
  ], 'La solicitud');

  // Normaliza la cita opcional
  const appointmentId = normalizeDocumentId(
    data.appointmentId,
    'La cita',
    true
  );

  // Normaliza el cliente opcional
  const clientId = normalizeDocumentId(data.clientId, 'El cliente', true);

  // Normaliza el correo opcional del mostrador
  const receiptEmail = normalizeReceiptEmail(data.receiptEmail);

  // Impide reemplazar el cliente de una cita
  if (appointmentId && clientId) {
    fail('invalid-argument', 'La cita define el cliente de la venta');
  }

  // Impide reemplazar el correo canónico de una cita
  if (appointmentId && receiptEmail) {
    fail('invalid-argument', 'La cita define el correo del comprobante');
  }

  // Impide reemplazar el correo de un cliente conocido
  if (clientId && receiptEmail) {
    fail('invalid-argument', 'El cliente define el correo del comprobante');
  }

  // Detiene claves idempotentes inseguras
  if (
    typeof data.idempotencyKey !== 'string'
    || !IDEMPOTENCY_PATTERN.test(data.idempotencyKey)
  ) {
    fail('invalid-argument', 'La clave de operación no es válida');
  }

  // Normaliza los pagos recibidos
  const payments = normalizePayments(data.payments);

  // Normaliza los productos solicitados
  const productItems = normalizeProductItems(data.productItems ?? []);

  // Impide ventas de mostrador vacías
  if (!appointmentId && productItems.length === 0) {
    fail('invalid-argument', 'La venta de mostrador requiere productos');
  }

  // Devuelve el contrato canónico
  return {
    appointmentId,
    clientId,
    idempotencyKey: data.idempotencyKey,
    payments,
    productItems,
    receiptEmail
  };
};
