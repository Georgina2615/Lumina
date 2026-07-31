import { FieldValue } from 'firebase-admin/firestore';
import { calculateSaleTotals } from './SaleCalculation.js';
import {
  buildInitialTicketResponse,
  buildResponseTotals
} from './SaleDocuments.js';
import {
  buildCheckoutPaymentId,
  buildDepositPaymentId
} from './SaleIdentifiers.js';
import { writeSaleDocuments } from './SaleTransactionWrites.js';
import {
  requireAuthorizedActor,
  requireCheckoutAppointment,
  requireClient,
  requireDepositPayments
} from './StoredAppointmentPolicy.js';
import {
  mapExistingSaleResponse,
  requireRetailProduct
} from './StoredProductPolicy.js';

// Convierte una existencia baja en alerta
const buildWarning = (product) => ({
  productId: product.id,
  name: product.name,
  remainingStock: product.remainingStock,
  minimumStock: product.minimumStock
});

// Obtiene varias lecturas antes de escribir
const getSnapshots = async (transaction, references) => (
  references.length ? transaction.getAll(...references) : []
);

// Resuelve movimientos explícitos o el legado determinista
const resolveDepositPaymentIds = (appointmentId, appointment) => (
  Array.isArray(appointment?.pagosAnticipoIds)
    ? [...appointment.pagosAnticipoIds]
    : appointment
      ? [buildDepositPaymentId(appointmentId)]
      : []
);

// Ejecuta todas las escrituras financieras en una transacción
export const runSaleTransaction = async ({
  actorUid,
  firestore,
  folio,
  request,
  requestHash,
  saleId
}) => firestore.runTransaction(async (transaction) => {
  // Identifica al actor responsable
  const actorReference = firestore.collection('usuarios').doc(actorUid);

  // Identifica la venta determinista
  const saleReference = firestore.collection('ventas').doc(saleId);

  // Identifica la cita opcional
  const appointmentReference = request.appointmentId
    ? firestore.collection('citas').doc(request.appointmentId)
    : null;

  // Reúne las lecturas iniciales
  const initialReferences = [
    actorReference,
    saleReference,
    ...(appointmentReference ? [appointmentReference] : [])
  ];

  // Obtiene actor venta y cita
  const [
    actorSnapshot,
    saleSnapshot,
    appointmentSnapshot
  ] = await transaction.getAll(...initialReferences);

  requireAuthorizedActor(actorSnapshot);

  // Devuelve una venta ya procesada
  if (saleSnapshot.exists) {
    // Conserva el resultado de la primera ejecución
    return mapExistingSaleResponse(saleSnapshot, {
      actorUid,
      appointmentId: request.appointmentId,
      requestHash
    });
  }

  // Valida la cita cuando existe
  const appointmentData = appointmentReference
    ? requireCheckoutAppointment(appointmentSnapshot)
    : null;

  // Resuelve el cliente canónico
  const clientId = appointmentData?.clienteId ?? request.clientId;

  // Identifica al cliente opcional
  const clientReference = clientId
    ? firestore.collection('clientes').doc(clientId)
    : null;

  // Identifica los productos solicitados
  const productReferences = request.productItems.map(
    ({ productId }) => firestore.collection('productos').doc(productId)
  );

  // Resuelve los movimientos reales del anticipo
  const depositPaymentIds = resolveDepositPaymentIds(
    request.appointmentId,
    appointmentData
  );

  // Identifica todos los movimientos del anticipo
  const depositPaymentReferences = depositPaymentIds.map(
    (paymentId) => firestore.collection('pagos').doc(paymentId)
  );

  // Reúne las lecturas restantes
  const remainingReferences = [
    ...(clientReference ? [clientReference] : []),
    ...productReferences,
    ...depositPaymentReferences
  ];

  // Obtiene cliente productos y anticipos
  const remainingSnapshots = await getSnapshots(
    transaction,
    remainingReferences
  );

  // Controla la posición de cada lectura
  let snapshotIndex = 0;

  // Valida el cliente cuando existe
  const client = clientReference
    ? requireClient(remainingSnapshots[snapshotIndex++])
    : null;

  // Resuelve el correo canónico del comprobante
  const recipientEmail = client ? client.email : request.receiptEmail || '';

  // Valida cada producto vigente
  const products = productReferences.map((reference, index) => (
    requireRetailProduct(
      remainingSnapshots[snapshotIndex + index],
      request.productItems[index]
    )
  ));
  snapshotIndex += productReferences.length;

  // Construye el contexto de la cita
  const appointment = appointmentData ? {
    id: appointmentSnapshot.id,
    data: appointmentData
  } : null;

  // Verifica todos los movimientos reales del anticipo
  const depositEvidence = appointment
    ? requireDepositPayments({
      snapshots: remainingSnapshots.slice(snapshotIndex),
      paymentIds: depositPaymentIds,
      appointment
    })
    : { payments: [], totalCents: 0 };

  // Calcula el resultado financiero
  const totals = calculateSaleTotals({
    servicePriceCents: appointmentData?.precioServicioCentavos ?? 0,
    depositCents: depositEvidence.totalCents,
    productLines: products,
    payments: request.payments
  });

  // Crea una marca temporal del servidor
  const timestamp = FieldValue.serverTimestamp();

  // Construye identificadores de liquidación
  const checkoutPaymentIds = request.payments.map(
    (_, index) => buildCheckoutPaymentId(saleId, index)
  );

  // Construye alertas de existencias
  const inventoryWarnings = products
    .filter((product) => product.remainingStock <= product.minimumStock)
    .map(buildWarning);

  // Escribe todos los documentos relacionados
  writeSaleDocuments({
    actorUid,
    appointment,
    appointmentData,
    appointmentReference,
    client,
    checkoutPaymentIds,
    depositPaymentIds,
    depositPaymentReferences,
    depositPayments: depositEvidence.payments,
    firestore,
    folio,
    inventoryWarnings,
    productReferences,
    products,
    request,
    requestHash,
    saleId,
    saleReference,
    timestamp,
    transaction,
    totals
  });

  // Devuelve el cierre confirmado
  return {
    saleId,
    folio,
    appointmentId: request.appointmentId,
    totals: buildResponseTotals(totals),
    inventoryWarnings,
    ...buildInitialTicketResponse(recipientEmail),
    alreadyProcessed: false
  };
});
