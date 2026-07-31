import { AppointmentError } from './AppointmentError.js';

// Define los métodos individuales permitidos
const SIMPLE_METHODS = new Set([
  'efectivo',
  'tarjeta',
  'transferencia'
]);

// Define los métodos totales permitidos
const DEPOSIT_METHODS = new Set([...SIMPLE_METHODS, 'mixto']);

// Define el máximo monetario aceptado
const MAX_AMOUNT_CENTS = 100_000_000;

// Lanza un error conocido del dominio
const fail = (message) => {
  throw new AppointmentError('invalid-argument', message);
};

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Normaliza evidencia financiera
const normalizeEvidence = (value, maxLength = 120) => {
  // Limpia el texto recibido
  const normalized = typeof value === 'string' ? value.trim() : '';

  // Detiene evidencia excesiva
  if (normalized.length > maxLength) {
    fail('La referencia del anticipo es demasiado larga');
  }

  // Devuelve la evidencia normalizada
  return normalized;
};

// Normaliza una parte del anticipo
const normalizePayment = (payment) => {
  // Detiene pagos que no son objetos
  if (!isRecord(payment)) {
    fail('El pago del anticipo no es válido');
  }

  // Define las propiedades permitidas
  const allowedKeys = [
    'method',
    'amountCents',
    'cashReceivedCents',
    'changeCents',
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

  // Obtiene los campos principales
  const method = payment.method;
  const amountCents = payment.amountCents;

  // Detiene métodos desconocidos
  if (!SIMPLE_METHODS.has(method)) {
    fail('La forma de pago del anticipo no es válida');
  }

  // Detiene importes fuera de rango
  if (
    !Number.isSafeInteger(amountCents)
    || amountCents <= 0
    || amountCents > MAX_AMOUNT_CENTS
  ) {
    fail('El importe del anticipo no es válido');
  }

  // Normaliza la referencia de operación
  const reference = normalizeEvidence(payment.reference);

  // Normaliza la terminación de tarjeta
  const cardLastFour = typeof payment.cardLastFour === 'string'
    ? payment.cardLastFour.trim()
    : '';

  // Exige evidencia para operaciones electrónicas
  if (
    ['tarjeta', 'transferencia'].includes(method)
    && reference.length < 3
  ) {
    const label = method === 'tarjeta'
      ? 'Escribe el folio o autorización de la terminal'
      : 'Escribe la clave de rastreo o referencia de transferencia';
    fail(label);
  }

  // Impide referencias en efectivo
  if (method === 'efectivo' && reference) {
    fail('La referencia no corresponde al pago en efectivo');
  }

  // Detiene terminaciones inválidas
  if (
    cardLastFour
    && (method !== 'tarjeta' || !/^\d{4}$/.test(cardLastFour))
  ) {
    fail('Los últimos cuatro dígitos de la tarjeta no son válidos');
  }

  // Normaliza los campos de efectivo
  const cashReceivedCents = payment.cashReceivedCents ?? 0;
  const changeCents = payment.changeCents ?? 0;

  // Valida el efectivo y su cambio
  if (
    method === 'efectivo'
    && (
      !Number.isSafeInteger(cashReceivedCents)
      || cashReceivedCents < amountCents
      || cashReceivedCents > MAX_AMOUNT_CENTS
      || !Number.isSafeInteger(changeCents)
      || changeCents !== cashReceivedCents - amountCents
    )
  ) {
    fail('El efectivo recibido o el cambio no es válido');
  }

  // Impide efectivo en otros métodos
  if (
    method !== 'efectivo'
    && (cashReceivedCents !== 0 || changeCents !== 0)
  ) {
    fail('El efectivo recibido no corresponde al método seleccionado');
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

// Normaliza el anticipo recibido
export const normalizeAppointmentDeposit = (deposit) => {
  // Detiene contratos desconocidos
  if (!isRecord(deposit)) {
    fail('El anticipo no es válido');
  }

  // Rechaza propiedades adicionales
  const invalidKey = Object.keys(deposit).find(
    (key) => !['method', 'payments'].includes(key)
  );

  // Detiene contratos con información adicional
  if (invalidKey) {
    fail('El anticipo contiene campos no permitidos');
  }

  // Obtiene el contrato principal
  const method = deposit.method;
  const payments = deposit.payments;

  // Detiene métodos y cantidades inválidas
  if (
    !DEPOSIT_METHODS.has(method)
    || !Array.isArray(payments)
    || payments.length !== (method === 'mixto' ? 2 : 1)
  ) {
    fail('Selecciona una forma de pago válida');
  }

  // Normaliza cada parte
  const normalizedPayments = payments.map(normalizePayment);

  // Verifica el método simple
  if (
    method !== 'mixto'
    && normalizedPayments[0].method !== method
  ) {
    fail('La forma de pago no coincide con el anticipo');
  }

  // Verifica los métodos mixtos
  if (
    method === 'mixto'
    && normalizedPayments[0].method === normalizedPayments[1].method
  ) {
    fail('El pago mixto requiere métodos diferentes');
  }

  // Devuelve el anticipo canónico
  return { method, payments: normalizedPayments };
};

// Consolida el anticipo contra el precio real
export const requireExpectedDeposit = ({
  deposit,
  priceCents,
  percentage
}) => {
  // Detiene precios o porcentajes inseguros
  if (
    !Number.isSafeInteger(priceCents)
    || priceCents <= 0
    || priceCents > MAX_AMOUNT_CENTS
    || !Number.isSafeInteger(percentage)
    || percentage !== 30
    || !Number.isSafeInteger(priceCents * percentage)
  ) {
    throw new AppointmentError(
      'failed-precondition',
      'El servicio no tiene una configuración de anticipo válida'
    );
  }

  // Calcula el anticipo canónico
  const amountCents = Math.round(priceCents * percentage / 100);

  // Suma todas las partes
  const paidCents = deposit.payments.reduce(
    (total, payment) => total + payment.amountCents,
    0
  );

  // Detiene importes que no coinciden
  if (!Number.isSafeInteger(paidCents) || paidCents !== amountCents) {
    fail('Los pagos no suman el anticipo requerido');
  }

  // Devuelve el anticipo consolidado
  return { ...deposit, amountCents };
};

// Convierte una parte al contrato persistente
export const buildStoredDepositPart = (payment) => ({
  metodo: payment.method,
  montoCentavos: payment.amountCents,
  efectivoRecibidoCentavos: payment.cashReceivedCents,
  cambioCentavos: payment.changeCents,
  referencia: payment.method === 'efectivo' ? '' : payment.reference,
  ultimosCuatro: payment.method === 'tarjeta'
    ? payment.cardLastFour
    : ''
});
