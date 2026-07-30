// Define la única sucursal operativa
const BRANCH_ID = 'principal';

// Convierte los totales al esquema persistente
const mapStoredTotals = (totals) => ({
  subtotalCentavos: totals.subtotalCents,
  ivaIncluidoCentavos: totals.taxCents,
  totalCentavos: totals.totalCents,
  servicioCentavos: totals.serviceTotalCents,
  productosCentavos: totals.productsTotalCents,
  anticipoAplicadoCentavos: totals.depositCents,
  saldoCobradoCentavos: totals.balanceDueCents,
  totalPagadoCentavos: totals.totalPaidCents
});

// Construye las líneas congeladas de venta
const buildItems = (appointment, products) => {
  // Incluye el servicio cuando existe una cita
  const items = appointment ? [{
    tipo: 'servicio',
    referenciaId: appointment.servicioId,
    nombre: appointment.servicio.trim(),
    categoria: 'servicio',
    cantidad: 1,
    precioUnitarioCentavos: appointment.precioServicioCentavos,
    totalCentavos: appointment.precioServicioCentavos
  }] : [];
  products.forEach((product) => items.push({
    tipo: 'producto',
    referenciaId: product.id,
    nombre: product.name,
    categoria: product.category,
    cantidad: product.quantity,
    precioUnitarioCentavos: product.unitPriceCents,
    totalCentavos: product.unitPriceCents * product.quantity
  }));

  // Devuelve las líneas canónicas
  return items;
};

// Construye el comprobante financiero canónico
export const buildSaleDocument = ({
  actorUid,
  appointment,
  client,
  depositPaymentId,
  checkoutPaymentIds,
  folio,
  inventoryWarnings,
  request,
  requestHash,
  products,
  timestamp,
  totals
}) => ({
  folio,
  tipo: appointment ? 'cita' : 'mostrador',
  citaId: request.appointmentId,
  clienteId: client?.id ?? null,
  clienteNombre: client?.name ?? 'Mostrador',
  clienteEmail: client?.email ?? '',
  items: buildItems(appointment, products),
  desglose: mapStoredTotals(totals),
  metodosPago: request.payments.map(({ method }) => method),
  pagoAnticipoId: depositPaymentId,
  pagosLiquidacionIds: checkoutPaymentIds,
  alertasInventario: inventoryWarnings,
  estado: 'pagada',
  ticket: {
    estado: 'pendiente',
    intentos: 0,
    enviadoEn: null,
    ultimoError: ''
  },
  sucursalId: BRANCH_ID,
  idempotencia: {
    clave: request.idempotencyKey,
    hashSolicitud: requestHash
  },
  creadaEn: timestamp,
  cobradaPor: actorUid,
  schemaVersion: 1
});

// Convierte los totales internos a la respuesta pública
export const buildResponseTotals = (totals) => ({
  subtotalCents: totals.subtotalCents,
  taxCents: totals.taxCents,
  totalCents: totals.totalCents,
  depositCents: totals.depositCents,
  balanceDueCents: totals.balanceDueCents,
  paidNowCents: totals.paidNowCents,
  totalPaidCents: totals.totalPaidCents
});

// Construye un pago recibido durante el cierre
export const buildCheckoutPaymentDocument = ({
  actorUid,
  appointment,
  client,
  payment,
  saleId,
  timestamp
}) => ({
  citaId: appointment?.id ?? null,
  ventaId: saleId,
  clienteId: client?.id ?? null,
  tipo: 'liquidacion',
  metodo: payment.method,
  montoCentavos: payment.amountCents,
  efectivoRecibidoCentavos: payment.cashReceivedCents,
  cambioCentavos: payment.changeCents,
  referencia: payment.reference,
  ultimosCuatro: payment.cardLastFour,
  estado: 'confirmado',
  fecha: timestamp,
  actorUid,
  sucursalId: BRANCH_ID,
  schemaVersion: 1
});

// Construye el movimiento auditable de existencias
export const buildInventoryMovementDocument = ({
  actorUid,
  product,
  saleId,
  timestamp
}) => ({
  productoId: product.id,
  productoNombre: product.name,
  ventaId: saleId,
  tipo: 'salida_venta',
  cantidad: product.quantity,
  cambioExistencias: -product.quantity,
  existenciasAnteriores: product.previousStock,
  existenciasPosteriores: product.remainingStock,
  sucursalId: BRANCH_ID,
  fecha: timestamp,
  actorUid,
  schemaVersion: 1
});

// Construye el cierre enlazado con la cita
export const buildAppointmentUpdate = ({
  actorUid,
  folio,
  saleId,
  timestamp,
  totals
}) => ({
  estado: 'finalizada',
  ventaId: saleId,
  folioVenta: folio,
  cobro: {
    totalCentavos: totals.totalCents,
    anticipoAplicadoCentavos: totals.depositCents,
    saldoCobradoCentavos: totals.balanceDueCents,
    fecha: timestamp
  },
  actualizadaEn: timestamp,
  actualizadaPor: actorUid
});

// Construye el evento final de la cita
export const buildFinalizedEvent = ({
  actorUid,
  saleId,
  timestamp
}) => ({
  tipo: 'cambio_estado',
  estadoAnterior: 'por_cobrar',
  estadoNuevo: 'finalizada',
  motivo: null,
  actorUid,
  fecha: timestamp,
  anticipoResultado: null,
  ventaId: saleId
});
