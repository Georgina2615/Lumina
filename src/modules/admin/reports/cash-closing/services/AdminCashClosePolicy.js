const MAX_CENTS = 100_000_000;

// Convierte pesos visibles en centavos
export const parseCashCloseCents = (value) => {
  const normalized = String(value ?? '').trim();
  if (!/^\d{1,7}(\.\d{0,2})?$/.test(normalized)) return null;
  const [pesos, decimals = ''] = normalized.split('.');
  const cents = Number(pesos) * 100 + Number(decimals.padEnd(2, '0'));

  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
};

// Convierte centavos para un campo de dinero
export const formatCashCloseInput = (cents = 0) => (
  (Number.isSafeInteger(cents) ? cents : 0) / 100
).toFixed(2);

// Formatea moneda mexicana
export const formatCashCloseCurrency = (cents = 0) => (
  new Intl.NumberFormat('es-MX', {
    currency: 'MXN',
    style: 'currency'
  }).format((Number.isSafeInteger(cents) ? cents : 0) / 100)
);

// Obtiene el dia anterior sin usar la zona del dispositivo
export const getPreviousBusinessDateKey = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'America/Mexico_City',
      year: 'numeric'
    }).formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  );
  const previous = new Date(Date.UTC(parts.year, parts.month - 1, parts.day - 1));

  return previous.toISOString().slice(0, 10);
};

// Construye los limites del dia seleccionado
export const getCashCloseDateRange = (dateKey) => {
  const start = new Date(`${dateKey}T00:00:00-06:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

// Construye una solicitud segura para el servidor
export const buildAdminCashCloseRequest = ({ close, form, dateKey }) => {
  const openingCashCents = parseCashCloseCents(form.openingCash);
  const withdrawalsCents = parseCashCloseCents(form.withdrawals);
  const countedCashCents = parseCashCloseCents(form.countedCash);

  if ([openingCashCents, withdrawalsCents, countedCashCents].includes(null)) {
    throw new Error('Revisa los importes del corte');
  }

  const action = close ? 'correct' : 'close';
  const request = {
    action,
    dateKey,
    openingCashCents,
    withdrawalsCents,
    countedCashCents,
    operationId: `cash_close_${crypto.randomUUID()}`
  };

  if (action === 'correct') {
    const reason = form.reason.trim().replace(/\s+/g, ' ');
    if (reason.length < 5) {
      throw new Error('Explica por qué necesitas corregir el corte');
    }
    request.reason = reason;
    request.expectedRevision = close.revision;
  }

  return request;
};

// Calcula los valores que se presentaran antes de guardar
export const calculateCashClosePreview = ({ form, paymentTotals }) => {
  const openingCashCents = parseCashCloseCents(form.openingCash);
  const withdrawalsCents = parseCashCloseCents(form.withdrawals);
  const countedCashCents = parseCashCloseCents(form.countedCash);

  if ([openingCashCents, withdrawalsCents, countedCashCents].includes(null)) {
    return null;
  }

  const expectedCashCents = openingCashCents
    + (paymentTotals?.efectivo ?? 0)
    - withdrawalsCents;

  if (expectedCashCents < 0) return null;
  return {
    expectedCashCents,
    differenceCents: countedCashCents - expectedCashCents
  };
};
