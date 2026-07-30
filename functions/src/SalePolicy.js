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
    'productItems'
  ], 'La solicitud');

  // Normaliza la cita opcional
  const appointmentId = normalizeDocumentId(
    data.appointmentId,
    'La cita',
    true
  );

  // Normaliza el cliente opcional
  const clientId = normalizeDocumentId(data.clientId, 'El cliente', true);

  // Impide reemplazar el cliente de una cita
  if (appointmentId && clientId) {
    fail('invalid-argument', 'La cita define el cliente de la venta');
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
    productItems
  };
};
