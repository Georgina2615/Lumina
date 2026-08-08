import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  requireClientIdentity,
  requireClientProfile,
  requireVerifiedClientEmail
} from './ClientAccountPolicy.js';
import { buildClientInvoiceRequest } from './ClientInvoiceDocuments.js';
import {
  requireInvoiceSale,
  validateClientInvoiceRequest
} from './ClientInvoicePolicy.js';

// Registra una solicitud fiscal vinculada con una venta real
export const requestClientInvoiceHandler = async ({ auth, data, firestore }) => {
  const email = requireVerifiedClientEmail(auth);
  const request = validateClientInvoiceRequest(data);
  const identitySnapshot = await firestore.collection('identidadesClientes')
    .doc(`correo:${email}`)
    .get();
  const clientId = requireClientIdentity(identitySnapshot);
  const clientSnapshot = await firestore.collection('clientes').doc(clientId).get();
  requireClientProfile(clientSnapshot, email);
  const saleReference = firestore.collection('ventas').doc(request.saleId);
  const invoiceReference = firestore.collection('solicitudesFactura')
    .doc(request.saleId);
  const timestamp = Timestamp.now();

  try {
    return await firestore.runTransaction(async (transaction) => {
      const [saleSnapshot, invoiceSnapshot] = await Promise.all([
        transaction.get(saleReference),
        transaction.get(invoiceReference)
      ]);
      const sale = requireInvoiceSale(saleSnapshot, clientId);

      if (invoiceSnapshot.exists) {
        return {
          invoiceStatus: String(invoiceSnapshot.data().estado ?? 'pendiente'),
          saleId: request.saleId
        };
      }

      transaction.create(invoiceReference, buildClientInvoiceRequest({
        clientId,
        request,
        sale,
        timestamp
      }));
      return { invoiceStatus: 'pendiente', saleId: request.saleId };
    });
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'No pudimos guardar la solicitud de factura');
  }
};
