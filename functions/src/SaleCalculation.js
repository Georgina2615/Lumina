import { SaleError } from './SaleError.js';
import { sumPaymentCents } from './SalePaymentPolicy.js';

// Lanza un error financiero esperado
const fail = (message) => {
  throw new SaleError('failed-precondition', message);
};

// Suma centavos sin perder precisión
const addSafeCents = (first, second) => {
  // Calcula el total solicitado
  const total = first + second;

  // Detiene totales inseguros
  if (!Number.isSafeInteger(total)) {
    fail('El total de la venta no es válido');
  }

  // Devuelve el total validado
  return total;
};

// Calcula importes con IVA incluido
export const calculateSaleTotals = ({
  servicePriceCents,
  depositCents,
  productLines,
  payments
}) => {
  // Suma todas las líneas de productos
  const productsTotalCents = productLines.reduce((total, product) => {
    // Calcula el importe de la línea
    const lineTotal = product.unitPriceCents * product.quantity;

    // Detiene multiplicaciones inseguras
    if (!Number.isSafeInteger(lineTotal)) {
      fail('El total de un producto no es válido');
    }

    // Devuelve el acumulado validado
    return addSafeCents(total, lineTotal);
  }, 0);

  // Obtiene el total del servicio
  const serviceTotalCents = servicePriceCents ?? 0;

  // Obtiene el anticipo aplicable
  const appliedDepositCents = depositCents ?? 0;

  // Calcula el total con IVA incluido
  const totalCents = addSafeCents(serviceTotalCents, productsTotalCents);

  // Detiene ventas vacías o anticipos excesivos
  if (totalCents <= 0 || appliedDepositCents > serviceTotalCents) {
    fail('El total de la venta no es válido');
  }

  // Calcula el saldo pendiente
  const balanceDueCents = totalCents - appliedDepositCents;

  // Suma los pagos del cierre
  const paidNowCents = sumPaymentCents(payments);

  // Exige liquidación exacta
  if (balanceDueCents !== paidNowCents) {
    fail('Los pagos no suman el saldo pendiente');
  }

  // Desglosa el IVA incluido
  const taxCents = Math.round(totalCents * 16 / 116);

  // Calcula la base antes del IVA
  const subtotalCents = totalCents - taxCents;

  // Devuelve el desglose financiero
  return {
    subtotalCents,
    taxCents,
    totalCents,
    serviceTotalCents,
    productsTotalCents,
    depositCents: appliedDepositCents,
    balanceDueCents,
    paidNowCents,
    totalPaidCents: appliedDepositCents + paidNowCents
  };
};
