import { createHash } from 'node:crypto';
import { RetailInventoryError } from './RetailInventoryError.js';

// Genera un código interno estable
export const buildRetailSku = (productId) => {
  const hash = createHash('sha256')
    .update(productId)
    .digest('hex')
    .slice(0, 10)
    .toUpperCase();
  return `LS-${hash}`;
};

// Agrega una versión estable a la imagen pública
export const buildVersionedRetailImageUrl = (imageUrl, revision) => {
  const url = new URL(imageUrl);
  url.searchParams.set('v', String(revision));
  return url.toString();
};

// Multiplica valores enteros de manera segura
export const multiplySafeIntegers = (first, second) => {
  const result = first * second;
  if (!Number.isSafeInteger(result)) {
    throw new RetailInventoryError(
      'invalid-argument',
      'El valor calculado supera el límite permitido'
    );
  }
  return result;
};

// Calcula el costo promedio ponderado
export const calculateWeightedAverageCost = ({
  currentCostCents,
  currentStock,
  incomingCostCents,
  incomingQuantity
}) => {
  if (incomingCostCents === null) {
    return currentCostCents;
  }
  if (currentCostCents === null || currentStock === 0) {
    return incomingCostCents;
  }
  const currentValue = multiplySafeIntegers(currentCostCents, currentStock);
  const incomingValue = multiplySafeIntegers(
    incomingCostCents,
    incomingQuantity
  );
  const totalUnits = currentStock + incomingQuantity;
  const totalValue = currentValue + incomingValue;
  if (!Number.isSafeInteger(totalUnits) || !Number.isSafeInteger(totalValue)) {
    throw new RetailInventoryError(
      'invalid-argument',
      'El costo promedio supera el límite permitido'
    );
  }
  return Math.round(totalValue / totalUnits);
};
