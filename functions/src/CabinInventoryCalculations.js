import { CabinInventoryError } from './CabinInventoryError.js';

// Define las escalas admitidas por cada unidad
export const CABIN_UNIT_SCALES = Object.freeze({
  ml: 1000,
  g: 1000,
  pieza: 1
});

// Define la única sucursal operativa
export const CABIN_BRANCH_ID = 'principal';

// Reconoce movimientos que aumentan existencias
export const POSITIVE_CABIN_MOVEMENTS = new Set([
  'entrada_reabastecimiento',
  'ajuste_positivo'
]);

// Verifica un resultado monetario seguro
const requireSafeMoneyResult = (value) => {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1_000_000_000) {
    throw new CabinInventoryError(
      'invalid-argument',
      'El valor calculado supera el límite permitido'
    );
  }
  return value;
};

// Calcula las existencias posteriores
export const calculateCabinStock = ({
  previousStockScaled,
  quantityScaled,
  type
}) => {
  const direction = POSITIVE_CABIN_MOVEMENTS.has(type) ? 1 : -1;
  const nextStockScaled = previousStockScaled + direction * quantityScaled;
  if (!Number.isSafeInteger(nextStockScaled) || nextStockScaled < 0) {
    throw new CabinInventoryError(
      'failed-precondition',
      'El movimiento dejaría existencias negativas'
    );
  }
  return nextStockScaled;
};

// Conserva el valor proporcional de las existencias restantes
export const calculateProportionalInventoryValue = ({
  currentValueCents,
  previousStockScaled,
  nextStockScaled
}) => {
  if (nextStockScaled === 0) {
    return 0;
  }
  if (previousStockScaled <= 0 || nextStockScaled > previousStockScaled) {
    throw new CabinInventoryError(
      'failed-precondition',
      'No se pudo calcular el valor proporcional del inventario'
    );
  }
  const denominator = BigInt(previousStockScaled);
  const numerator = BigInt(currentValueCents) * BigInt(nextStockScaled);
  const roundedValue = (numerator + denominator / 2n) / denominator;
  return requireSafeMoneyResult(Number(roundedValue));
};

// Conserva el costo promedio al ampliar existencias
export const calculateExpandedInventoryValue = ({
  currentValueCents,
  previousStockScaled,
  nextStockScaled
}) => {
  if (previousStockScaled <= 0 || nextStockScaled <= previousStockScaled) {
    throw new CabinInventoryError(
      'failed-precondition',
      'Captura un costo para ajustar un insumo sin existencias'
    );
  }
  const denominator = BigInt(previousStockScaled);
  const numerator = BigInt(currentValueCents) * BigInt(nextStockScaled);
  const roundedValue = (numerator + denominator / 2n) / denominator;
  return requireSafeMoneyResult(Number(roundedValue));
};

// Calcula el valor privado posterior
export const calculateCabinInventoryValue = ({
  currentValueCents,
  previousStockScaled,
  nextStockScaled,
  totalCostCents,
  type
}) => {
  const hasNewCost = totalCostCents !== null
    && totalCostCents !== undefined;
  if (type === 'entrada_reabastecimiento' || hasNewCost) {
    return requireSafeMoneyResult(
      currentValueCents + (totalCostCents ?? 0)
    );
  }
  if (type === 'ajuste_positivo') {
    return calculateExpandedInventoryValue({
      currentValueCents,
      previousStockScaled,
      nextStockScaled
    });
  }
  return calculateProportionalInventoryValue({
    currentValueCents,
    previousStockScaled,
    nextStockScaled
  });
};
