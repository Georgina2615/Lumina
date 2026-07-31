const paymentTypes = new Set(['anticipo', 'liquidacion']);
const saleTypes = new Set(['cita', 'mostrador']);

// Reconoce importes monetarios canónicos
const isPositiveCents = (value) => (
  Number.isSafeInteger(value) && value > 0
);

// Convierte marcas temporales válidas
const getTimestampMillis = (value) => (
  typeof value?.toMillis === 'function' ? value.toMillis() : null
);

// Traduce un pago confirmado al contrato del panel
export const mapDashboardPayment = (payment) => {
  const paidAt = getTimestampMillis(payment.fecha);
  const isCompatible = payment.schemaVersion === 1
    && payment.estado === 'confirmado'
    && paymentTypes.has(payment.tipo)
    && isPositiveCents(payment.montoCentavos)
    && paidAt !== null;

  if (!isCompatible) {
    return null;
  }

  return {
    amountCents: payment.montoCentavos,
    paidAt
  };
};

// Traduce una venta pagada al contrato visual
export const mapDashboardSale = (documentSnapshot) => {
  const sale = documentSnapshot.data();
  const createdAt = typeof sale.creadaEn?.toDate === 'function'
    ? sale.creadaEn.toDate()
    : null;
  const totalCents = sale.desglose?.totalCentavos;
  const isCompatible = sale.schemaVersion === 1
    && sale.estado === 'pagada'
    && saleTypes.has(sale.tipo)
    && createdAt instanceof Date
    && !Number.isNaN(createdAt.getTime())
    && isPositiveCents(totalCents)
    && typeof sale.folio === 'string'
    && sale.folio.trim();

  if (!isCompatible) {
    return null;
  }

  return {
    clientName: String(sale.clienteNombre ?? '').trim() || 'Mostrador',
    createdAt,
    folio: sale.folio.trim(),
    id: documentSnapshot.id,
    methods: Array.isArray(sale.metodosPago)
      ? sale.metodosPago.filter((method) => typeof method === 'string')
      : [],
    totalCents,
    type: sale.tipo
  };
};

// Traduce un producto activo al contrato visual
export const mapDashboardProduct = (documentSnapshot) => {
  const product = documentSnapshot.data();
  const isCompatible = product.schemaVersion === 1
    && typeof product.nombre === 'string'
    && product.nombre.trim()
    && typeof product.categoria === 'string'
    && product.categoria.trim()
    && Number.isSafeInteger(product.existencias)
    && product.existencias >= 0
    && Number.isSafeInteger(product.stockMinimo)
    && product.stockMinimo >= 0;

  if (!isCompatible) {
    return null;
  }

  return {
    category: product.categoria.trim(),
    id: documentSnapshot.id,
    minimumStock: product.stockMinimo,
    name: product.nombre.trim(),
    stock: product.existencias
  };
};
