const PAYMENT_METHODS = Object.freeze([
  'efectivo',
  'tarjeta',
  'transferencia'
]);
const paymentMethodSet = new Set(PAYMENT_METHODS);
const paymentTypeSet = new Set(['anticipo', 'liquidacion']);
const saleTypeSet = new Set(['cita', 'mostrador']);
const MAX_PAYMENT_CENTS = 100_000_000;

// Reconoce importes monetarios canónicos
const isPositiveCents = (value) => (
  Number.isSafeInteger(value)
  && value > 0
  && value <= MAX_PAYMENT_CENTS
);

// Convierte una marca temporal válida
const getTimestampDate = (value) => {
  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : null;

  return date instanceof Date && !Number.isNaN(date.getTime())
    ? date
    : null;
};

// Normaliza texto financiero opcional
const normalizeEvidence = (value) => (
  typeof value === 'string' ? value.trim() : ''
);

// Valida un identificador relacionado
const normalizeClientId = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === 'string'
    && /^[A-Za-z0-9_-]{1,150}$/.test(value)
    ? value
    : undefined;
};

// Convierte una parte de anticipo al contrato del reporte
const mapDepositPart = (part) => {
  if (
    !part
    || typeof part !== 'object'
    || Array.isArray(part)
    || !paymentMethodSet.has(part.metodo)
    || !isPositiveCents(part.montoCentavos)
  ) {
    return null;
  }

  return {
    amountCents: part.montoCentavos,
    method: part.metodo,
    reference: normalizeEvidence(part.referencia)
  };
};

// Verifica que el método resumido coincida con sus partes
const hasMatchingDepositMethod = (method, parts) => {
  const methods = [...new Set(parts.map((part) => part.method))];

  return methods.length === 1
    ? method === methods[0]
    : methods.length === 2 && method === 'mixto';
};

// Suma partes sin perder precisión monetaria
const sumPartAmounts = (parts) => {
  const total = parts.reduce(
    (sum, part) => sum + part.amountCents,
    0
  );

  return Number.isSafeInteger(total) ? total : null;
};

// Construye los importes por método de un pago
const buildMethodAmounts = (parts) => Object.fromEntries(
  PAYMENT_METHODS.map((method) => [
    method,
    parts
      .filter((part) => part.method === method)
      .reduce((sum, part) => sum + part.amountCents, 0)
  ])
);

// Resume las evidencias presentes sin inventar datos
const buildReference = (parts) => (
  [...new Set(parts.map((part) => part.reference).filter(Boolean))]
    .join(' / ')
);

// Traduce un pago confirmado al contrato administrativo
export const mapAdminReportPayment = (documentSnapshot) => {
  const payment = documentSnapshot.data();
  const paidAt = getTimestampDate(payment.fecha);
  const clientId = normalizeClientId(payment.clienteId);
  const isCompatible = payment.schemaVersion === 1
    && payment.estado === 'confirmado'
    && paymentTypeSet.has(payment.tipo)
    && isPositiveCents(payment.montoCentavos)
    && paidAt
    && clientId !== undefined
    && (payment.tipo !== 'anticipo' || clientId !== null);

  if (!isCompatible) {
    return null;
  }

  const parts = payment.tipo === 'anticipo'
    ? Array.isArray(payment.partes)
      ? payment.partes.map(mapDepositPart)
      : []
    : [{
      amountCents: payment.montoCentavos,
      method: payment.metodo,
      reference: normalizeEvidence(payment.referencia)
    }];
  const hasValidParts = [1, 2].includes(parts.length)
    && parts.every(Boolean)
    && parts.every((part) => paymentMethodSet.has(part.method))
    && new Set(parts.map((part) => part.method)).size === parts.length
    && sumPartAmounts(parts) === payment.montoCentavos
    && (
      payment.tipo === 'liquidacion'
      || hasMatchingDepositMethod(payment.metodo, parts)
    );

  if (!hasValidParts) {
    return null;
  }

  return {
    amountCents: payment.montoCentavos,
    clientId,
    id: documentSnapshot.id,
    methodAmounts: buildMethodAmounts(parts),
    methods: parts.map((part) => part.method),
    paidAt,
    reference: buildReference(parts),
    type: payment.tipo
  };
};

// Reconoce una venta terminada del esquema vigente
export const mapAdminReportSale = (documentSnapshot) => {
  const sale = documentSnapshot.data();
  const createdAt = getTimestampDate(sale.creadaEn);

  if (
    sale.schemaVersion !== 1
    || sale.estado !== 'pagada'
    || !saleTypeSet.has(sale.tipo)
    || !createdAt
  ) {
    return null;
  }

  return {
    createdAt,
    id: documentSnapshot.id
  };
};

// Traduce un cliente al nombre visible del reporte
export const mapAdminReportClientName = (documentSnapshot) => {
  const name = String(documentSnapshot.data().nombreCompleto ?? '').trim();

  return name || null;
};

// Expone métodos estables para los acumuladores
export const adminReportPaymentMethods = PAYMENT_METHODS;
