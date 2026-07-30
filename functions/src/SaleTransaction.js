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
  requireDepositPayment
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

  // Identifica el anticipo previo
  const depositPaymentReference = appointmentData
    ? firestore.collection('pagos').doc(
      buildDepositPaymentId(request.appointmentId)
    )
    : null;

  // Reúne las lecturas restantes
  const remainingReferences = [
    ...(clientReference ? [clientReference] : []),
    ...productReferences,
    ...(depositPaymentReference ? [depositPaymentReference] : [])
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

  // Verifica el anticipo consolidado
  if (depositPaymentReference) {
    requireDepositPayment({
      snapshot: remainingSnapshots[snapshotIndex],
      appointment
    });
  }

  // Calcula el resultado financiero
  const totals = calculateSaleTotals({
    servicePriceCents: appointmentData?.precioServicioCentavos ?? 0,
    depositCents: appointmentData?.anticipoMontoCentavos ?? 0,
    productLines: products,
    payments: request.payments
  });

  // Crea una marca temporal del servidor
  const timestamp = FieldValue.serverTimestamp();

  // Construye identificadores de liquidación
  const checkoutPaymentIds = request.payments.map(
    (_, index) => buildCheckoutPaymentId(saleId, index)
  );

  // Conserva el identificador del anticipo
  const depositPaymentId = depositPaymentReference?.id ?? null;

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
    depositPaymentId,
    depositPaymentReference,
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
