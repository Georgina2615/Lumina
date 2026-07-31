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

// Resuelve el correo canónico del comprobante
const resolveRecipientEmail = (client, request) => (
  client ? client.email : request.receiptEmail || ''
);

// Reúne los métodos reales sin duplicados
const buildPaymentMethods = (depositPayments, payments) => {
  // Obtiene los métodos desde los movimientos reales
  const depositMethods = depositPayments.flatMap(
    ({ partes }) => partes.map(({ metodo }) => metodo)
  );

  // Obtiene los métodos de liquidación
  const checkoutMethods = payments.map(({ method }) => method);

  // Devuelve etiquetas financieras únicas
  return [...new Set([...depositMethods, ...checkoutMethods])];
};

// Construye el comprobante financiero canónico
export const buildSaleDocument = ({
  actorUid,
  appointment,
  client,
  depositPaymentIds = [],
  depositPayments = [],
  checkoutPaymentIds,
  folio,
  inventoryWarnings,
  request,
  requestHash,
  products,
  timestamp,
  totals
}) => {
  // Obtiene el destinatario permitido
  const recipientEmail = resolveRecipientEmail(client, request);

  // Devuelve la venta canónica
  return {
    folio,
    tipo: appointment ? 'cita' : 'mostrador',
    citaId: request.appointmentId,
    clienteId: client?.id ?? null,
    clienteNombre: client?.name ?? 'Mostrador',
    clienteEmail: recipientEmail,
    items: buildItems(appointment, products),
    desglose: mapStoredTotals(totals),
    metodosPago: buildPaymentMethods(depositPayments, request.payments),
    pagoAnticipoId: depositPaymentIds[0] ?? null,
    pagosAnticipoIds: [...depositPaymentIds],
    pagosLiquidacionIds: checkoutPaymentIds,
    alertasInventario: inventoryWarnings,
    estado: 'pagada',
    ticket: {
      estado: recipientEmail ? 'pendiente' : 'omitido',
      intentos: 0,
      intentoId: null,
      ultimoIntentoEn: null,
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
  };
};

// Construye el estado inicial del ticket
export const buildInitialTicketResponse = (recipientEmail) => ({
  recipientEmail,
  ticketStatus: recipientEmail ? 'pendiente' : 'omitido'
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
  costoUnitarioCentavos: product.unitCostCents,
  costoTotalCentavos: product.unitCostCents === null
    ? null
    : product.unitCostCents * product.quantity,
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
