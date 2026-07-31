export const initialRetailStock = 30;
export const defaultMinimumStock = 5;

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Formatea importes canónicos para la interfaz
export const formatInventoryCurrency = (cents) => (
  Number.isSafeInteger(cents)
    ? currencyFormatter.format(cents / 100)
    : 'Sin configurar'
);

// Convierte pesos visibles en centavos seguros
export const parseInventoryCents = (value) => {
  const cents = Math.round(Number(value) * 100);

  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
};

// Construye el formulario inicial del producto
export const createProductFormState = (product = null) => ({
  acquisitionCost: product?.averageCostCents
    ? String(product.averageCostCents / 100)
    : '',
  brand: product?.brand ?? '',
  category: product?.category ?? '',
  description: product?.description ?? '',
  minimumStock: String(product?.minimumStock ?? defaultMinimumStock),
  name: product?.name ?? '',
  price: product?.priceCents ? String(product.priceCents / 100) : ''
});

// Valida el formulario antes de contactar al servidor
export const validateProductForm = (form, creating) => {
  if (form.name.trim().length < 2 || form.name.trim().length > 120) {
    return 'Escribe un nombre de producto válido';
  }

  if (form.brand.trim().length < 2 || form.brand.trim().length > 80) {
    return 'Escribe una marca válida';
  }

  if (form.category.trim().length < 2 || form.category.trim().length > 80) {
    return 'Escribe una categoría válida';
  }

  if (form.description.trim().length > 500) {
    return 'La descripción no puede superar quinientos caracteres';
  }

  if (parseInventoryCents(form.price) === null) {
    return 'Escribe un precio de venta válido';
  }

  if (
    !Number.isSafeInteger(Number(form.minimumStock))
    || Number(form.minimumStock) < 0
    || Number(form.minimumStock) > 99999
  ) {
    return 'Escribe un stock mínimo válido';
  }

  if (creating && parseInventoryCents(form.acquisitionCost) === null) {
    return 'Escribe el costo unitario de adquisición';
  }

  return null;
};

// Traduce el formulario al contrato callable
export const buildProductCommand = (form, creating) => {
  const command = {
    brand: form.brand.trim(),
    category: form.category.trim(),
    description: form.description.trim(),
    minimumStock: Number(form.minimumStock),
    name: form.name.trim(),
    priceCents: parseInventoryCents(form.price)
  };

  return creating
    ? {
      ...command,
      unitCostCents: parseInventoryCents(form.acquisitionCost)
    }
    : command;
};

// Reconoce movimientos que agregan existencias
export const isStockEntry = (movementType) => (
  ['entrada_reabastecimiento', 'ajuste_positivo'].includes(movementType)
);

export const stockMovementOptions = [
  {
    label: 'Reabastecimiento por compra',
    type: 'entrada_reabastecimiento'
  },
  {
    label: 'Corrección positiva de conteo',
    type: 'ajuste_positivo'
  },
  {
    label: 'Corrección negativa de conteo',
    type: 'ajuste_negativo'
  },
  {
    label: 'Salida por merma',
    type: 'salida_merma'
  },
  {
    label: 'Salida por caducidad',
    type: 'salida_caducidad'
  }
];

// Valida un movimiento antes de contactar al servidor
export const validateStockMovement = (form, product) => {
  const quantity = Number(form.quantity);

  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 99999) {
    return 'Escribe una cantidad válida de unidades';
  }

  if (!isStockEntry(form.type) && quantity > product.stock) {
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
    && parseInventoryCents(form.unitCost) === null
  ) {
    return 'Escribe el costo unitario de esta compra';
  }

  if (
    form.type === 'ajuste_positivo'
    && form.unitCost
    && parseInventoryCents(form.unitCost) === null
  ) {
    return 'Escribe un costo unitario válido';
  }

  return null;
};

// Traduce el formulario al contrato de existencias
export const buildStockMovementCommand = (form) => ({
  quantity: Number(form.quantity),
  reason: form.reason.trim(),
  reference: form.reference.trim(),
  type: form.type,
  unitCostCents: isStockEntry(form.type) && form.unitCost
    ? parseInventoryCents(form.unitCost)
    : null
});

// Devuelve un identificador idempotente seguro
export const createOperationId = () => (
  globalThis.crypto.randomUUID()
);
