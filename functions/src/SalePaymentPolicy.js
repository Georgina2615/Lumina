import { SaleError } from './SaleError.js';

// Define los métodos simples disponibles
const PAYMENT_METHODS = new Set([
  'efectivo',
  'tarjeta',
  'transferencia'
]);

// Define el máximo monetario por operación
const MAX_AMOUNT_CENTS = 100_000_000;

// Lanza un error conocido del dominio
const fail = (message) => {
  throw new SaleError('invalid-argument', message);
};

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Rechaza propiedades fuera del contrato
const assertPaymentKeys = (payment) => {
  // Define las propiedades permitidas
  const allowedKeys = [
    'method',
    'amountCents',
    'cashReceivedCents',
    'reference',
    'cardLastFour'
  ];

  // Busca una propiedad desconocida
  const invalidKey = Object.keys(payment).find(
    (key) => !allowedKeys.includes(key)
  );

  // Detiene contratos con información adicional
  if (invalidKey) {
    fail('El pago contiene campos no permitidos');
  }
};

// Normaliza texto financiero opcional
const normalizeText = (value, {
  label,
  required = false,
  minLength = 0,
  maxLength = 100,
  pattern
}) => {
  // Limpia el texto recibido
  const normalized = typeof value === 'string' ? value.trim() : '';

  // Detiene textos fuera del contrato
  if (
    (required && !normalized)
    || (normalized && normalized.length < minLength)
    || normalized.length > maxLength
    || (normalized && pattern && !pattern.test(normalized))
  ) {
    fail(`${label} no es válido`);
  }

  // Devuelve el texto normalizado
  return normalized;
};

// Normaliza una parte del pago
const normalizePayment = (payment) => {
  // Detiene pagos que no son objetos
  if (!isRecord(payment)) {
    fail('La forma de pago no es válida');
  }

  // Limita el contrato de pago
  assertPaymentKeys(payment);

  // Obtiene el método solicitado
  const method = payment.method;

  // Obtiene el monto solicitado
  const amountCents = payment.amountCents;

  // Detiene métodos desconocidos
  if (!PAYMENT_METHODS.has(method)) {
    fail('La forma de pago no es válida');
  }

  // Detiene montos fuera de rango
  if (
    !Number.isSafeInteger(amountCents)
    || amountCents <= 0
    || amountCents > MAX_AMOUNT_CENTS
  ) {
    fail('El monto del pago no es válido');
  }

  // Normaliza la referencia financiera
  const reference = normalizeText(payment.reference, {
    label: 'La referencia',
    required: method === 'transferencia',
    minLength: method === 'transferencia' ? 3 : 0,
    maxLength: 120
  });

  // Normaliza la terminación de tarjeta
  const cardLastFour = normalizeText(payment.cardLastFour, {
    label: 'Los últimos cuatro dígitos',
    pattern: /^\d{4}$/
  });

  // Impide datos de tarjeta en otros métodos
  if (method !== 'tarjeta' && cardLastFour) {
    fail('Los datos de tarjeta no corresponden al pago');
  }

  // Impide referencias en efectivo
  if (method === 'efectivo' && reference) {
    fail('La referencia no corresponde al pago');
  }

  // Inicializa el efectivo recibido
  let cashReceivedCents = 0;

  // Inicializa el cambio entregado
  let changeCents = 0;

  // Valida el efectivo cuando corresponde
  if (method === 'efectivo') {
    cashReceivedCents = payment.cashReceivedCents;

    // Detiene efectivo insuficiente o excesivo
    if (
      !Number.isSafeInteger(cashReceivedCents)
      || cashReceivedCents < amountCents
      || cashReceivedCents > MAX_AMOUNT_CENTS
    ) {
      fail('El efectivo recibido no es válido');
    }

    // Calcula el cambio exacto
    changeCents = cashReceivedCents - amountCents;
  } else if (
    payment.cashReceivedCents !== undefined
    && payment.cashReceivedCents !== null
    && payment.cashReceivedCents !== 0
  ) {
    fail('El efectivo recibido no corresponde al pago');
  }

  // Devuelve la parte canónica
  return {
    method,
    amountCents,
    cashReceivedCents,
    changeCents,
    reference,
    cardLastFour
  };
};

// Valida una o dos partes de pago
export const normalizePayments = (payments) => {
  // Detiene cantidades de métodos inválidas
  if (!Array.isArray(payments) || ![1, 2].includes(payments.length)) {
    fail('Selecciona una o dos formas de pago');
  }

  // Normaliza todas las partes
  const normalized = payments.map(normalizePayment);

  // Impide métodos repetidos en pagos mixtos
  if (
    normalized.length === 2
    && normalized[0].method === normalized[1].method
  ) {
    fail('El pago mixto requiere métodos diferentes');
  }

  // Devuelve el pago canónico
  return normalized;
};

// Suma montos enteros sin perder precisión
export const sumPaymentCents = (payments) => {
  // Acumula los importes recibidos
  const total = payments.reduce(
    (sum, payment) => sum + payment.amountCents,
    0
  );

  // Detiene totales fuera de rango
  if (!Number.isSafeInteger(total) || total > MAX_AMOUNT_CENTS) {
    fail('El total de pagos no es válido');
  }

  // Devuelve el total validado
  return total;
};
