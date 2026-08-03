import {
  adminReportPaymentMethods
} from './AdminReportMapperService.js';

// Construye los totales vacíos del reporte
const createEmptyTotals = () => ({
  depositCents: 0,
  finalPaymentCents: 0,
  methodTotals: Object.fromEntries(
    adminReportPaymentMethods.map((method) => [method, 0])
  ),
  totalReceivedCents: 0
});

// Suma centavos sin perder precisión
const addSafeCents = (current, amount) => {
  const next = current + amount;

  return Number.isSafeInteger(next) ? next : null;
};

// Intenta acumular un pago completo
const addPayment = (totals, payment) => {
  const nextTotal = addSafeCents(
    totals.totalReceivedCents,
    payment.amountCents
  );
  const typeKey = payment.type === 'anticipo'
    ? 'depositCents'
    : 'finalPaymentCents';
  const nextTypeTotal = addSafeCents(
    totals[typeKey],
    payment.amountCents
  );
  const nextMethodTotals = { ...totals.methodTotals };

  // Detiene el pago si un subtotal resulta inseguro
  if (nextTotal === null || nextTypeTotal === null) {
    return null;
  }

  // Acumula cada parte del pago mixto
  for (const method of adminReportPaymentMethods) {
    const nextMethodTotal = addSafeCents(
      nextMethodTotals[method],
      payment.methodAmounts[method]
    );

    // Detiene totales monetarios fuera del rango seguro
    if (nextMethodTotal === null) {
      return null;
    }

    nextMethodTotals[method] = nextMethodTotal;
  }

  // Devuelve una fotografía nueva sin mutar la anterior
  return {
    ...totals,
    [typeKey]: nextTypeTotal,
    methodTotals: nextMethodTotals,
    totalReceivedCents: nextTotal
  };
};

// Resume pagos válidos y separa los que no pueden sumarse
export const calculateAdminReportTotals = (payments) => {
  let totals = createEmptyTotals();
  const acceptedPayments = [];
  let unsafePaymentCount = 0;

  payments.forEach((payment) => {
    const nextTotals = addPayment(totals, payment);

    // Conserva únicamente pagos sumados por completo
    if (!nextTotals) {
      unsafePaymentCount += 1;
      return;
    }

    totals = nextTotals;
    acceptedPayments.push(payment);
  });

  // Expone totales pagos aceptados y cantidad descartada
  return { acceptedPayments, totals, unsafePaymentCount };
};
