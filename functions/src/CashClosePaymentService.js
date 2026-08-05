import { createHash } from 'node:crypto';
import { buildCashCloseDayRange, failCashClose } from './CashClosePolicy.js';

const paymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
const paymentMethodSet = new Set(paymentMethods);
const paymentTypeSet = new Set(['anticipo', 'liquidacion']);

// Reconoce un importe positivo seguro
const isPositiveCents = (value) => (
  Number.isSafeInteger(value) && value > 0 && value <= 100_000_000
);

// Convierte una parte de pago valida
const mapPaymentPart = (part) => {
  if (
    !part
    || typeof part !== 'object'
    || Array.isArray(part)
    || !paymentMethodSet.has(part.metodo)
    || !isPositiveCents(part.montoCentavos)
  ) {
    return null;
  }

  return { method: part.metodo, amountCents: part.montoCentavos };
};

// Convierte un pago persistido a importes por metodo
const mapStoredPayment = (snapshot) => {
  const payment = snapshot.data();
  if (
    payment?.schemaVersion !== 1
    || payment.estado !== 'confirmado'
    || !paymentTypeSet.has(payment.tipo)
    || !isPositiveCents(payment.montoCentavos)
  ) {
    return null;
  }

  const parts = payment.tipo === 'anticipo'
    ? Array.isArray(payment.partes) ? payment.partes.map(mapPaymentPart) : []
    : [mapPaymentPart({
      metodo: payment.metodo,
      montoCentavos: payment.montoCentavos
    })];
  const amount = parts.reduce(
    (total, part) => total + (part?.amountCents ?? 0),
    0
  );

  if (
    ![1, 2].includes(parts.length)
    || parts.some((part) => !part)
    || new Set(parts.map(({ method }) => method)).size !== parts.length
    || amount !== payment.montoCentavos
  ) {
    return null;
  }

  return { id: snapshot.id, amountCents: amount, parts };
};

// Calcula los cobros reales de un dia
export const calculateCashClosePayments = (snapshots) => {
  const payments = snapshots.map(mapStoredPayment);
  if (payments.some((payment) => !payment)) {
    failCashClose(
      'failed-precondition',
      'Hay cobros que necesitan revisión antes de cerrar el día'
    );
  }

  const methodTotals = Object.fromEntries(
    paymentMethods.map((method) => [method, 0])
  );
  let totalCents = 0;

  payments.forEach((payment) => {
    totalCents += payment.amountCents;
    payment.parts.forEach(({ method, amountCents }) => {
      methodTotals[method] += amountCents;
    });
  });

  if (
    !Number.isSafeInteger(totalCents)
    || Object.values(methodTotals).some((value) => !Number.isSafeInteger(value))
  ) {
    failCashClose('failed-precondition', 'Los cobros del día superan el límite permitido');
  }

  const fingerprintSource = payments
    .map(({ id, amountCents }) => `${id}:${amountCents}`)
    .sort()
    .join('|');

  return {
    methodTotals,
    paymentCount: payments.length,
    paymentFingerprint: createHash('sha256')
      .update(fingerprintSource)
      .digest('hex'),
    totalCents
  };
};

// Consulta los cobros del dia seleccionado
export const loadCashClosePayments = async ({ firestore, dateKey }) => {
  const { start, end } = buildCashCloseDayRange(dateKey);
  const snapshot = await firestore.collection('pagos')
    .where('fecha', '>=', start)
    .where('fecha', '<', end)
    .get();

  return calculateCashClosePayments(snapshot.docs);
};
