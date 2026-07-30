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
    throw new Error('Escribe un importe válido');
  }

  // Calcula el importe entero
  const amountCents = Math.round(Number(normalizedValue) * 100);

  // Detiene cantidades fuera de rango
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    throw new Error('Escribe un importe válido');
  }

  // Devuelve centavos seguros
  return amountCents;
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

  // Detiene transferencias sin referencia
  if (method === 'transferencia' && reference.length < 3) {
    throw new Error('Escribe la referencia de transferencia');
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
    throw new Error('El efectivo recibido no cubre el importe');
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
export const createPaymentPart = (method) => ({
  method,
  amount: '',
  cashReceived: '',
  reference: '',
  cardLastFour: ''
});

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

// Construye el documento consolidado del anticipo
export const buildDepositPaymentData = ({
  actorUid,
  appointmentId,
  clientId,
  deposit,
  timestamp
}) => {
  // Devuelve el movimiento financiero
  return {
    citaId: appointmentId,
    ventaId: null,
    clienteId: clientId,
    tipo: 'anticipo',
    metodo: deposit.method,
    montoCentavos: deposit.amountCents,
    partes: deposit.payments,
    estado: 'confirmado',
    fecha: timestamp,
    actorUid,
    sucursalId: 'principal',
    schemaVersion: 1
  };
};
