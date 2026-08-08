import { onCall } from 'firebase-functions/v2/https';
import { getAdminInvoiceRequestsHandler } from './GetAdminInvoiceRequests.js';
import { manageAdminInvoiceRequestHandler } from './ManageAdminInvoiceRequest.js';

// Expone las operaciones privadas de facturación
export const createAdminInvoiceFunctions = ({
  enforceAppCheck,
  firestore,
  runtimeOptions
}) => ({
  getAdminInvoiceRequests: onCall({
    ...runtimeOptions,
    enforceAppCheck
  }, (request) => getAdminInvoiceRequestsHandler({
    auth: request.auth,
    firestore: firestore()
  })),
  manageAdminInvoiceRequest: onCall({
    ...runtimeOptions,
    enforceAppCheck
  }, (request) => manageAdminInvoiceRequestHandler({
    auth: request.auth,
    data: request.data,
    firestore: firestore()
  }))
});
