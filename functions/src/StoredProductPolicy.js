import { SaleError } from './SaleError.js';

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new SaleError(code, message);
};

// Reconoce enteros monetarios positivos
const isPositiveInteger = (value) => (
  Number.isSafeInteger(value) && value > 0
);

// Lee el costo privado sin bloquear productos heredados
export const readRetailProductUnitCost = (snapshot, productId) => {
  if (!snapshot?.exists) {
    return null;
  }
  const data = snapshot.data();
  return (
    data.schemaVersion === 1
    && data.productoId === productId
    && isPositiveInteger(data.costoPromedioCentavos)
  )
    ? data.costoPromedioCentavos
    : null;
};

// Verifica precio y existencias del catálogo canónico
export const requireRetailProduct = (
  snapshot,
  requestedItem,
  costSnapshot = null
) => {
  // Detiene productos inexistentes
  if (!snapshot.exists) {
    fail('not-found', 'Uno de los productos ya no existe');
  }

  // Obtiene el producto vigente
  const data = snapshot.data();

  // Verifica catálogo precio y disponibilidad
  if (
    data.schemaVersion !== 1
    || data.activo !== true
    || typeof data.nombre !== 'string'
    || !data.nombre.trim()
    || typeof data.categoria !== 'string'
    || !data.categoria.trim()
    || !isPositiveInteger(data.precioCentavos)
    || !Number.isSafeInteger(data.existencias)
    || data.existencias < requestedItem.quantity
    || !Number.isSafeInteger(data.stockMinimo)
    || data.stockMinimo < 0
  ) {
    // Distingue la falta de existencias
    const message = (
      Number.isSafeInteger(data.existencias)
      && data.existencias < requestedItem.quantity
    )
      ? `No hay existencias suficientes de ${data.nombre || 'un producto'}`
      : 'Uno de los productos no está disponible';
    fail('failed-precondition', message);
  }

  // Calcula la existencia posterior
  const remainingStock = data.existencias - requestedItem.quantity;

  // Devuelve la línea canónica
  return {
    id: snapshot.id,
    name: data.nombre.trim(),
    category: data.categoria.trim(),
    unitPriceCents: data.precioCentavos,
    unitCostCents: readRetailProductUnitCost(costSnapshot, snapshot.id),
    quantity: requestedItem.quantity,
    previousStock: data.existencias,
    remainingStock,
    minimumStock: data.stockMinimo
  };
};

// Convierte una venta persistida en una respuesta segura
export const mapExistingSaleResponse = (snapshot, request) => {
  // Obtiene la venta existente
  const data = snapshot.data();

  // Obtiene el desglose persistido
  const breakdown = data.desglose;

  // Impide reutilizar operaciones incompatibles
  if (
    data.schemaVersion !== 1
    || data.estado !== 'pagada'
    || data.cobradaPor !== request.actorUid
    || data.citaId !== request.appointmentId
    || !breakdown
    || data.idempotencia?.hashSolicitud !== request.requestHash
  ) {
    fail('already-exists', 'La clave de operación ya fue utilizada');
  }

  // Devuelve la misma respuesta sin nuevas escrituras
  return {
    saleId: snapshot.id,
    folio: data.folio,
    appointmentId: data.citaId,
    totals: {
      subtotalCents: breakdown.subtotalCentavos,
      taxCents: breakdown.ivaIncluidoCentavos,
      totalCents: breakdown.totalCentavos,
      depositCents: breakdown.anticipoAplicadoCentavos,
      balanceDueCents: breakdown.saldoCobradoCentavos,
      paidNowCents: breakdown.saldoCobradoCentavos,
      totalPaidCents: breakdown.totalPagadoCentavos
    },
    inventoryWarnings: data.alertasInventario ?? [],
    recipientEmail: typeof data.clienteEmail === 'string'
      ? data.clienteEmail
      : '',
    ticketStatus: data.ticket?.estado ?? 'omitido',
    alreadyProcessed: true
  };
};
