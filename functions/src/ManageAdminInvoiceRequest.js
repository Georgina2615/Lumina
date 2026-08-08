import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { buildAdminInvoiceUpdate } from './AdminInvoiceDocuments.js';
import {
  getNextInvoiceStatus,
  requireInvoiceAdmin,
  requireStoredAdminInvoice,
  validateAdminInvoiceRequest
} from './AdminInvoicePolicy.js';

// Cambia una solicitud fiscal de forma controlada
export const manageAdminInvoiceRequestHandler = async ({
  auth,
  data,
  firestore,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para administrar facturas');
  }
  const request = validateAdminInvoiceRequest(data);
  const actorReference = firestore.collection('usuarios').doc(auth.uid);
  const invoiceReference = firestore.collection('solicitudesFactura')
    .doc(request.invoiceId);

  return firestore.runTransaction(async (transaction) => {
    const [actorSnapshot, invoiceSnapshot] = await Promise.all([
      transaction.get(actorReference),
      transaction.get(invoiceReference)
    ]);
    requireInvoiceAdmin(actorSnapshot);
    const invoice = requireStoredAdminInvoice(invoiceSnapshot, request);
    const status = getNextInvoiceStatus(invoice.estado, request.action);
    const revision = request.expectedRevision + 1;

    transaction.update(invoiceReference, buildAdminInvoiceUpdate({
      actorUid: auth.uid,
      request,
      status,
      timestamp: serverTimestamp()
    }));

    return { invoiceId: request.invoiceId, revision, status };
  });
};
