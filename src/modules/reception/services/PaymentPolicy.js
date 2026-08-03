// Define los métodos simples permitidos
const simplePaymentMethods = new Set([
  'efectivo',
  'tarjeta',
  'transferencia'
]);

// Convierte una entrada monetaria a centavos
const parseMoneyToCents = (value) => {
  // Conserva únicamente entradas monetarias válidas
  const normalizedValue = String(value ?? '').trim();

  // Detiene cantidades con formato inválido
  if (!/^\d+(\.\d{1,2})?$/.test(normalizedValue)) {
    throw new Error('Escribe un monto válido');
  }

  // Calcula el importe entero
  const amountCents = Math.round(Number(normalizedValue) * 100);

  // Detiene cantidades fuera de rango
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('Escribe un monto válido');
  }

  // Devuelve centavos seguros
  return amountCents;
};

// Convierte centavos a una entrada monetaria editable
const formatCentsForInput = (amountCents) => {
  // Devuelve una entrada vacía cuando aún no existe importe
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return '';
  }

  // Conserva hasta dos decimales sin ceros innecesarios
  return String(amountCents / 100);
};

// Normaliza la evidencia de una parte del pago
const normalizePaymentPart = (part, amountCents) => {
  // Obtiene el método solicitado
  const method = part?.method;

  // Detiene métodos desconocidos
  if (!simplePaymentMethods.has(method)) {
    throw new Error('Selecciona una forma de pago válida');
  }

  // Normaliza referencias opcionales
  const reference = String(part.reference ?? '').trim();
  const cardLastFour = String(part.cardLastFour ?? '').replace(/\D/g, '');

  // Detiene tarjetas sin autorización
  if (method === 'tarjeta' && reference.length < 3) {
    throw new Error('Escribe el folio o autorización de la terminal');
  }

  // Detiene transferencias sin clave de rastreo
  if (method === 'transferencia' && reference.length < 3) {
    throw new Error('Escribe la clave de rastreo o referencia SPEI');
  }

  // Detiene referencias demasiado largas
  if (reference.length > 120) {
    throw new Error('La referencia es demasiado larga');
  }

  // Detiene terminaciones de tarjeta inválidas
  if (cardLastFour && !/^\d{4}$/.test(cardLastFour)) {
    throw new Error('Escribe los últimos cuatro dígitos de la tarjeta');
  }

  // Calcula el efectivo recibido
  const cashReceivedCents = method === 'efectivo'
    ? parseMoneyToCents(part.cashReceived)
    : 0;

  // Detiene efectivo insuficiente
  if (method === 'efectivo' && cashReceivedCents < amountCents) {
    throw new Error('El efectivo recibido no cubre el monto');
  }

  // Calcula el cambio exacto
  const changeCents = method === 'efectivo'
    ? cashReceivedCents - amountCents
    : 0;

  // Devuelve la parte normalizada
  return {
    method,
    amountCents,
    cashReceivedCents,
    changeCents,
    reference: method === 'efectivo' ? '' : reference,
    cardLastFour: method === 'tarjeta' ? cardLastFour : ''
  };
};

// Crea una parte editable del pago
export const createPaymentPart = (method, appliedAmountCents = 0) => ({
  method,
  amount: '',
  cashReceived: method === 'efectivo'
    ? formatCentsForInput(appliedAmountCents)
    : '',
  cashReceivedEdited: false,
  reference: '',
  cardLastFour: ''
});

// Sincroniza el efectivo mientras no exista edición manual
export const syncCashReceived = (part, appliedAmountCents) => {
  // Conserva métodos distintos al efectivo
  if (part?.method !== 'efectivo') {
    return part;
  }

  // Conserva el importe capturado por la recepcionista
  if (part.cashReceivedEdited) {
    return part;
  }

  // Devuelve el efectivo igual al importe aplicado
  return {
    ...part,
    cashReceived: formatCentsForInput(appliedAmountCents)
  };
};

// Crea el estado inicial del pago
export const createPaymentDraft = () => ({
  method: '',
  primary: createPaymentPart('efectivo'),
  secondary: createPaymentPart('tarjeta')
});

// Construye el anticipo enviado a la capa de datos
export const buildDepositInput = (payment, depositCents) => {
  // Detiene anticipos sin importe real
  if (!Number.isSafeInteger(depositCents) || depositCents <= 0) {
    throw new Error('El anticipo no es válido');
  }

  // Detiene anticipos sin método
  if (!payment?.method) {
    throw new Error('Selecciona una forma de pago');
  }

  // Construye un anticipo simple
  if (payment.method !== 'mixto') {
    // Normaliza la única parte
    const normalizedPart = normalizePaymentPart(
      { ...payment.primary, method: payment.method },
      depositCents
    );

    // Devuelve el pago simple
    return {
      method: payment.method,
      payments: [normalizedPart]
    };
  }

  // Convierte el primer importe
  const primaryAmountCents = parseMoneyToCents(payment.primary.amount);
  const secondaryAmountCents = depositCents - primaryAmountCents;

  // Detiene distribuciones incompletas
  if (
    secondaryAmountCents <= 0
    || payment.primary.method === payment.secondary.method
  ) {
    throw new Error('Distribuye el anticipo entre dos métodos diferentes');
  }

  // Normaliza ambas partes
  const payments = [
    normalizePaymentPart(payment.primary, primaryAmountCents),
    normalizePaymentPart(payment.secondary, secondaryAmountCents)
  ];

  // Devuelve el pago mixto
  return { method: 'mixto', payments };
};
