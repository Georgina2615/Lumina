const quantityScales = {
  g: 1000,
  ml: 1000,
  pieza: 1
};

const quantityFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 3
});

// Obtiene la escala canónica de cada unidad
export const getCabinQuantityScale = (unit) => quantityScales[unit] ?? null;

// Convierte una cantidad visible en un entero seguro
export const parseCabinQuantity = (value, unit, allowZero = false) => {
  const scale = getCabinQuantityScale(unit);
  const normalizedValue = String(value ?? '').trim().replace(',', '.');
  const pattern = unit === 'pieza'
    ? /^\d+$/
    : /^\d+(?:\.\d{1,3})?$/;

  if (!scale || !pattern.test(normalizedValue)) {
    return null;
  }

  const [wholePart, decimalPart = ''] = normalizedValue.split('.');
  const fraction = unit === 'pieza'
    ? 0
    : Number(decimalPart.padEnd(3, '0'));
  const scaledQuantity = (Number(wholePart) * scale) + fraction;

  if (
    !Number.isSafeInteger(scaledQuantity)
    || scaledQuantity < 0
    || scaledQuantity > 999999999
    || (!allowZero && scaledQuantity === 0)
  ) {
    return null;
  }

  return scaledQuantity;
};

// Formatea una cantidad canónica para lectura humana
export const formatCabinQuantity = (scaledQuantity, unit) => {
  const scale = getCabinQuantityScale(unit);

  if (!scale || !Number.isSafeInteger(scaledQuantity)) {
    return 'Sin configurar';
  }

  const visibleQuantity = scaledQuantity / scale;
  const visibleUnit = unit === 'pieza' && visibleQuantity !== 1
    ? 'piezas'
    : unit;

  return `${quantityFormatter.format(visibleQuantity)} ${visibleUnit}`;
};

// Devuelve una cantidad canónica como valor editable
export const getCabinQuantityInputValue = (scaledQuantity, unit) => {
  const scale = getCabinQuantityScale(unit);

  if (!scale || !Number.isSafeInteger(scaledQuantity)) {
    return '';
  }

  return String(scaledQuantity / scale);
};
