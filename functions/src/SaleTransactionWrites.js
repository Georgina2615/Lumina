import {
  buildAppointmentUpdate,
  buildCheckoutPaymentDocument,
  buildFinalizedEvent,
  buildInventoryMovementDocument,
  buildSaleDocument
} from './SaleDocuments.js';
import { buildInventoryMovementId } from './SaleIdentifiers.js';

// Crea la venta y sus movimientos relacionados
export const writeSaleDocuments = ({
  actorUid,
  appointment,
  appointmentData,
  appointmentReference,
  checkoutPaymentIds,
  client,
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
  totals,
  transaction
}) => {
  // Crea la venta canónica
  transaction.create(saleReference, buildSaleDocument({
    actorUid,
    appointment: appointmentData,
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
  }));

  // Crea cada liquidación recibida
  request.payments.forEach((payment, index) => {
    // Identifica la liquidación
    const paymentReference = firestore.collection('pagos').doc(
      checkoutPaymentIds[index]
    );

    transaction.create(paymentReference, buildCheckoutPaymentDocument({
      actorUid,
      appointment,
      client,
      payment,
      saleId,
      timestamp
    }));
  });

  // Vincula el anticipo con la venta
  if (depositPaymentReference) {
    transaction.update(depositPaymentReference, { ventaId: saleId });
  }

  // Actualiza existencias y movimientos
  products.forEach((product, index) => {
    transaction.update(productReferences[index], {
      existencias: product.remainingStock,
      actualizadaEn: timestamp,
      actualizadaPor: actorUid
    });

    // Identifica el movimiento de inventario
    const movementReference = firestore
      .collection('movimientosInventario')
      .doc(buildInventoryMovementId(saleId, product.id));

    transaction.create(movementReference, buildInventoryMovementDocument({
      actorUid,
      product,
      saleId,
      timestamp
    }));
  });

  // Finaliza la cita vinculada
  if (appointmentReference) {
    transaction.update(appointmentReference, buildAppointmentUpdate({
      actorUid,
      folio,
      saleId,
      timestamp,
      totals
    }));
    transaction.create(
      appointmentReference.collection('eventos').doc('finalizada'),
      buildFinalizedEvent({ actorUid, saleId, timestamp })
    );
  }
};
