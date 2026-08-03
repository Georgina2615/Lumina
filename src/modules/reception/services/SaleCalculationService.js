// Configura moneda mexicana para presentación
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
});

// Enumera formas de pago individuales
const simplePaymentMethods = new Set([
  'efectivo',
  'tarjeta',
  'transferencia'
]);

// Verifica importes enteros expresados en centavos
const requireCents = (value, label) => {
  // Rechaza importes inseguros
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} no es válido`);
  }
  // Devuelve el importe verificado
  return value;
};

// Construye los importes de uno o dos pagos
const buildPaymentAmounts = (form, amountDueCents) => {
  requireCents(amountDueCents, 'El total');
  // Resuelve pagos con un solo método
  if (form.method !== 'mixto') {
    // Exige una forma reconocida
    if (!simplePaymentMethods.has(form.method)) {
      throw new Error('Selecciona una forma de pago');
    }
    // Devuelve el saldo completo
    return [{ method: form.method, amountCents: amountDueCents }];
  }

  // Convierte el primer importe mixto
  const primaryAmountCents = parseMoneyToCents(form.primaryAmount);
  // Exige métodos diferentes
  if (
    !simplePaymentMethods.has(form.primaryMethod)
    || !simplePaymentMethods.has(form.secondaryMethod)
    || form.primaryMethod === form.secondaryMethod
  ) {
    throw new Error('El pago mixto requiere dos métodos diferentes');
  }
  // Exige una distribución positiva
  if (
    primaryAmountCents === null
    || primaryAmountCents <= 0
    || primaryAmountCents >= amountDueCents
  ) {
    throw new Error('El primer monto debe ser menor al saldo');
  }
  // Devuelve dos importes exactos
  return [
    { method: form.primaryMethod, amountCents: primaryAmountCents },
    {
      method: form.secondaryMethod,
      amountCents: amountDueCents - primaryAmountCents
    }
  ];
};

// Añade los datos verificables de cada pago
const addPaymentDetails = (payment, form) => {
  // Añade efectivo y cambio verificable
  if (payment.method === 'efectivo') {
    // Convierte el efectivo recibido
    const cashReceivedCents = parseMoneyToCents(form.cashReceived);
    // Exige efectivo suficiente
    if (
      cashReceivedCents === null
      || cashReceivedCents < payment.amountCents
    ) {
      throw new Error('El efectivo recibido no cubre su monto');
    }
    // Devuelve el pago en efectivo
    return { ...payment, cashReceivedCents };
  }
  // Añade la referencia obligatoria
  if (payment.method === 'transferencia') {
    // Normaliza la referencia
    const reference = form.transferReference.trim();
    // Exige longitud válida
    if (reference.length < 3 || reference.length > 120) {
      throw new Error('La referencia debe tener entre tres y ciento veinte caracteres');
    }
    // Devuelve la transferencia
    return { ...payment, reference };
  }

  // Normaliza evidencia opcional de tarjeta
  const reference = form.cardReference.trim();
  // Normaliza los últimos dígitos
  const cardLastFour = form.cardLastFour.trim();
  // Limita la referencia
  if (reference.length > 120) {
    throw new Error('La referencia de tarjeta no puede superar ciento veinte caracteres');
  }
  // Verifica los últimos dígitos
  if (cardLastFour && !/^\d{4}$/.test(cardLastFour)) {
    throw new Error('Los últimos dígitos de tarjeta deben ser cuatro números');
  }
  // Devuelve el pago con tarjeta
  return {
    ...payment,
    ...(reference ? { reference } : {}),
    ...(cardLastFour ? { cardLastFour } : {})
  };
};

// Formatea centavos sin usarlos como unidad de negocio
export const formatCurrency = (amountCents) => (
  currencyFormatter.format(requireCents(amountCents, 'El monto') / 100)
);

// Convierte una captura monetaria a centavos exactos
export const parseMoneyToCents = (value) => {
  // Normaliza la captura decimal
  const normalizedValue = String(value ?? '').trim().replace(',', '.');
  // Descarta formatos imprecisos
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalizedValue)) {
    // Devuelve ausencia de importe
    return null;
  }
  // Separa unidades y centavos
  const [wholePart, decimalPart = ''] = normalizedValue.split('.');
  // Construye el entero exacto
  const amountCents = Number(wholePart) * 100
    + Number(decimalPart.padEnd(2, '0'));
  // Devuelve solo enteros seguros
  return Number.isSafeInteger(amountCents) ? amountCents : null;
};

// Calcula el desglose visual con IVA incluido
export const calculateSaleTotals = ({ items, depositAmountCents = 0 }) => {
  // Suma líneas usando centavos
  const grossTotalCents = items.reduce((totalCents, item) => {
    requireCents(item.unitPriceCents, 'El precio');
    // Exige cantidades enteras positivas
    if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      throw new Error('La cantidad no es válida');
    }
    // Calcula la línea exacta
    const lineTotalCents = item.unitPriceCents * item.quantity;
    // Devuelve el acumulado seguro
    return requireCents(totalCents + lineTotalCents, 'El total');
  }, 0);
  // Limita el anticipo al total
  const appliedDepositCents = Math.min(
    requireCents(depositAmountCents, 'El anticipo'),
    grossTotalCents
  );
  // Extrae el IVA ya incluido
  const includedTaxCents = Math.round(grossTotalCents * 16 / 116);

  // Devuelve el desglose visual
  return {
    grossTotalCents,
    netSubtotalCents: grossTotalCents - includedTaxCents,
    includedTaxCents,
    appliedDepositCents,
    amountDueCents: grossTotalCents - appliedDepositCents
  };
};

// Prepara los pagos para la función segura
export const createPaymentPayload = ({ form, amountDueCents }) => (
  buildPaymentAmounts(form, amountDueCents).map(
    (payment) => addPaymentDetails(payment, form)
  )
);

// Calcula importes auxiliares sin validar el formulario final
export const getPaymentPreview = ({ form, amountDueCents }) => {
  // Calcula el primer importe
  const primaryAmountCents = form.method === 'mixto'
    ? parseMoneyToCents(form.primaryAmount) ?? 0
    : amountDueCents;
  // Calcula el segundo importe
  const secondaryAmountCents = form.method === 'mixto'
    ? Math.max(amountDueCents - primaryAmountCents, 0)
    : 0;
  // Obtiene la parte pagada en efectivo
  const cashAmountCents = form.method === 'efectivo'
    ? amountDueCents
    : form.primaryMethod === 'efectivo'
      ? primaryAmountCents
      : form.secondaryMethod === 'efectivo'
        ? secondaryAmountCents
        : 0;
  // Convierte el efectivo capturado
  const cashReceivedCents = parseMoneyToCents(form.cashReceived) ?? 0;

  // Devuelve importes auxiliares
  return {
    primaryAmountCents,
    secondaryAmountCents,
    cashAmountCents,
    changeCents: Math.max(cashReceivedCents - cashAmountCents, 0)
  };
};
