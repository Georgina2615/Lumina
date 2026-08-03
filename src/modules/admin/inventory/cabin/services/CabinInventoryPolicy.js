import {
  getCabinQuantityInputValue,
  parseCabinQuantity
} from './CabinQuantityService';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

export const cabinUnitOptions = [
  { label: 'Mililitros', value: 'ml' },
  { label: 'Gramos', value: 'g' },
  { label: 'Piezas', value: 'pieza' }
];

export const cabinMovementOptions = [
  { label: 'Reabastecimiento por compra', type: 'entrada_reabastecimiento' },
  { label: 'Corrección positiva de conteo', type: 'ajuste_positivo' },
  { label: 'Corrección negativa de conteo', type: 'ajuste_negativo' },
  { label: 'Salida por merma', type: 'salida_merma' },
  { label: 'Salida por caducidad', type: 'salida_caducidad' }
];

// Formatea costos privados para administración
export const formatCabinCurrency = (cents) => (
  Number.isSafeInteger(cents)
    ? currencyFormatter.format(cents / 100)
    : 'Sin configurar'
);

// Convierte pesos visibles en centavos seguros
export const parseCabinCents = (value) => {
  const normalizedValue = String(value ?? '').trim().replace(',', '.');

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedValue)) {
    return null;
  }

  const [wholePart, decimalPart = ''] = normalizedValue.split('.');
  const cents = (Number(wholePart) * 100)
    + Number(decimalPart.padEnd(2, '0'));

  return Number.isSafeInteger(cents)
    && cents > 0
    && cents <= 1000000000
    ? cents
    : null;
};

// Construye el estado inicial del insumo
export const createCabinSupplyFormState = (supply = null) => ({
  brand: supply?.brand === 'Sin marca' ? '' : supply?.brand ?? '',
  category: supply?.category ?? '',
  description: supply?.description ?? '',
  initialQuantity: '',
  inventoryValue: '',
  minimumStock: supply
    ? getCabinQuantityInputValue(supply.minimumStockScaled, supply.unit)
    : '',
  name: supply?.name ?? '',
  unit: supply?.unit ?? ''
});

// Valida metadatos y valores iniciales
export const validateCabinSupplyForm = (form, creating) => {
  if (form.name.trim().length < 2 || form.name.trim().length > 120) {
    return 'Escribe un nombre de insumo válido';
  }

  if (form.brand.trim().length > 80) {
    return 'La marca no puede superar ochenta caracteres';
  }

  if (form.category.trim().length < 2 || form.category.trim().length > 80) {
    return 'Escribe una categoría válida';
  }

  if (form.description.trim().length > 500) {
    return 'La descripción no puede superar quinientos caracteres';
  }

  if (!cabinUnitOptions.some((option) => option.value === form.unit)) {
    return 'Selecciona la unidad de control';
  }

  if (parseCabinQuantity(form.minimumStock, form.unit, true) === null) {
    return 'Escribe una alerta de stock válida';
  }

  if (creating && parseCabinQuantity(form.initialQuantity, form.unit) === null) {
    return 'Escribe una cantidad inicial válida';
  }

  if (creating && parseCabinCents(form.inventoryValue) === null) {
    return 'Escribe el costo total del inventario inicial';
  }

  return null;
};

// Traduce el formulario al contrato callable
export const buildCabinSupplyCommand = (form, creating) => {
  const command = {
    brand: form.brand.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    minimumStockScaled: parseCabinQuantity(
      form.minimumStock,
      form.unit,
      true
    ),
    name: form.name.trim()
  };

  return creating
    ? {
      ...command,
      initialQuantityScaled: parseCabinQuantity(form.initialQuantity, form.unit),
      inventoryValueCents: parseCabinCents(form.inventoryValue),
      unit: form.unit
    }
    : command;
};

// Reconoce movimientos que agregan existencias
export const isCabinStockEntry = (type) => (
  ['entrada_reabastecimiento', 'ajuste_positivo'].includes(type)
);

// Valida un movimiento antes de contactar al servidor
export const validateCabinMovement = (form, supply) => {
  const quantityScaled = parseCabinQuantity(form.quantity, supply.unit);

  if (quantityScaled === null) {
    return 'Escribe una cantidad válida para la unidad seleccionada';
  }

  if (!isCabinStockEntry(form.type) && quantityScaled > supply.stockScaled) {
    return 'La salida no puede superar las existencias actuales';
  }

  if (form.reason.trim().length < 3 || form.reason.trim().length > 240) {
    return 'Escribe un motivo de al menos tres caracteres';
  }

  if (form.reference.trim().length > 120) {
    return 'La referencia no puede superar ciento veinte caracteres';
  }

  if (
    form.type === 'entrada_reabastecimiento'
    && parseCabinCents(form.totalCost) === null
  ) {
    return 'Escribe el costo total del reabastecimiento';
  }

  if (
    form.type === 'ajuste_positivo'
    && form.totalCost
    && parseCabinCents(form.totalCost) === null
  ) {
    return 'Escribe un costo total válido';
  }

  if (
    form.type === 'ajuste_positivo'
    && supply.stockScaled === 0
    && !form.totalCost
  ) {
    return 'Captura el costo de la corrección porque el insumo no tiene existencias';
  }

  return null;
};

// Traduce el movimiento al contrato callable
export const buildCabinMovementCommand = (form, unit) => {
  const totalCostCents = isCabinStockEntry(form.type) && form.totalCost
    ? parseCabinCents(form.totalCost)
    : null;
  const command = {
    quantityScaled: parseCabinQuantity(form.quantity, unit),
    reason: form.reason.trim(),
    reference: form.reference.trim(),
    type: form.type
  };

  return totalCostCents ? { ...command, totalCostCents } : command;
};

// Devuelve un identificador idempotente seguro
export const createCabinOperationId = () => globalThis.crypto.randomUUID();
