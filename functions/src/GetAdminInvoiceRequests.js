import { HttpsError } from 'firebase-functions/v2/https';
import { mapAdminInvoiceDocument } from './AdminInvoiceDocuments.js';
import { requireInvoiceAdmin } from './AdminInvoicePolicy.js';

// Consulta solicitudes fiscales solo para administración
export const getAdminInvoiceRequestsHandler = async ({ auth, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para consultar facturas');
  }

  const actorSnapshot = await firestore.collection('usuarios').doc(auth.uid).get();
  requireInvoiceAdmin(actorSnapshot);
  const invoiceSnapshot = await firestore.collection('solicitudesFactura')
    .orderBy('solicitadaEn', 'desc')
    .limit(100)
    .get();
  const mapped = invoiceSnapshot.docs.map(mapAdminInvoiceDocument);
  const requests = mapped.filter(Boolean);

  return {
    requests,
    warningCount: mapped.length - requests.length
  };
};
