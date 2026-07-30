// Define los métodos válidos para anticipos
const PAYMENT_METHODS = new Set([
  'efectivo',
  'tarjeta',
  'transferencia'
]);

// Define los campos exactos de cada parte
const DEPOSIT_PART_KEYS = [
  'metodo',
  'montoCentavos',
  'efectivoRecibidoCentavos',
  'cambioCentavos',
  'referencia',
  'ultimosCuatro'
];

// Reconoce enteros monetarios positivos
const isPositiveInteger = (value) => (
  Number.isSafeInteger(value) && value > 0
);

// Valida una parte financiera del anticipo
export const isValidDepositPart = (part) => {
  // Detiene valores que no son objetos
  if (!part || typeof part !== 'object' || Array.isArray(part)) {
    // Devuelve una validación negativa
    return false;
  }

  // Comprueba el contrato exacto
  const hasExactKeys = (
    Object.keys(part).length === DEPOSIT_PART_KEYS.length
    && DEPOSIT_PART_KEYS.every((key) => Object.hasOwn(part, key))
  );

  // Detiene contratos incompletos
  if (!hasExactKeys) {
    // Devuelve una validación negativa
    return false;
  }

  // Identifica la parte en efectivo
  const isCash = part.metodo === 'efectivo';

  // Valida los campos monetarios básicos
  const hasValidAmounts = (
    PAYMENT_METHODS.has(part.metodo)
    && isPositiveInteger(part.montoCentavos)
    && Number.isSafeInteger(part.efectivoRecibidoCentavos)
    && Number.isSafeInteger(part.cambioCentavos)
  );

  // Valida el comportamiento del efectivo
  const hasValidCash = (
    (isCash
      && part.efectivoRecibidoCentavos >= part.montoCentavos
      && part.cambioCentavos
        === part.efectivoRecibidoCentavos - part.montoCentavos)
    || (!isCash
      && part.efectivoRecibidoCentavos === 0
      && part.cambioCentavos === 0)
  );

  // Valida referencias y terminaciones
  const hasValidEvidence = (
    typeof part.referencia === 'string'
    && part.referencia.length <= 120
    && typeof part.ultimosCuatro === 'string'
    && (
      (part.metodo === 'efectivo'
        && part.referencia === ''
        && part.ultimosCuatro === '')
      || (part.metodo === 'transferencia'
        && part.referencia.trim().length >= 3
        && part.ultimosCuatro === '')
      || (part.metodo === 'tarjeta'
        && (!part.ultimosCuatro || /^\d{4}$/.test(part.ultimosCuatro)))
    )
  );

  // Devuelve el resultado de toda la parte
  return hasValidAmounts && hasValidCash && hasValidEvidence;
};

// Compara dos partes persistidas
export const hasSameDepositPart = (storedPart, appointmentPart) => (
  DEPOSIT_PART_KEYS.every(
    (key) => storedPart?.[key] === appointmentPart?.[key]
  )
);

// Compara marcas temporales de Firestore
export const hasSameTimestamp = (storedDate, appointmentDate) => {
  // Usa la comparación nativa cuando está disponible
  if (typeof storedDate?.isEqual === 'function') {
    // Devuelve la comparación temporal
    return storedDate.isEqual(appointmentDate);
  }

  // Conserva compatibilidad con valores simples de prueba
  return storedDate === appointmentDate;
};
