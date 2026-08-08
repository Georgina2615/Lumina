import { onCall, onRequest } from 'firebase-functions/v2/https';
import {
  confirmPublicPaymentHandler
} from './ConfirmPublicPayment.js';
import {
  createPublicPaymentPreferenceHandler
} from './CreatePublicPaymentPreference.js';
import {
  getPublicAvailabilityHandler
} from './GetPublicAvailability.js';
import { getClientAccountHandler } from './GetClientAccount.js';
import { getPublicProductCatalogHandler } from './GetPublicProductCatalog.js';
import {
  submitPublicAppointmentRequestHandler
} from './SubmitPublicAppointmentRequest.js';
import {
  evaluatePublicSkinTestHandler,
  getPublicSkinTestHandler
} from './PublicSkinTest.js';
import { mercadoPagoWebhookHandler } from './MercadoPagoWebhook.js';
import { requestClientInvoiceHandler } from './RequestClientInvoice.js';

// Expone las funciones protegidas del sitio publico
export const createPublicFunctions = ({
  enforceAppCheck,
  firestore,
  mercadoPagoAccessToken,
  mercadoPagoWebhookSecret,
  runtimeOptions,
  storage
}) => ({
  confirmPublicPayment: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public',
    secrets: [mercadoPagoAccessToken]
  }, (request) => confirmPublicPaymentHandler({
    accessToken: mercadoPagoAccessToken.value(),
    data: request.data,
    firestore: firestore()
  })),
  createPublicPaymentPreference: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public',
    secrets: [mercadoPagoAccessToken]
  }, (request) => createPublicPaymentPreferenceHandler({
    accessToken: mercadoPagoAccessToken.value(),
    data: request.data,
    firestore: firestore()
  })),
  evaluatePublicSkinTest: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public'
  }, (request) => evaluatePublicSkinTestHandler({
    data: request.data,
    firestore: firestore()
  })),
  getClientAccount: onCall({
    ...runtimeOptions,
    enforceAppCheck
  }, (request) => getClientAccountHandler({
    auth: request.auth,
    firestore: firestore()
  })),
  getPublicAvailability: onCall({
    ...runtimeOptions,
    enforceAppCheck
  }, (request) => getPublicAvailabilityHandler({
    data: request.data,
    firestore: firestore()
  })),
  getPublicProductCatalog: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public'
  }, () => getPublicProductCatalogHandler({
    firestore: firestore()
  })),
  getPublicSkinTest: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public'
  }, () => getPublicSkinTestHandler({
    firestore: firestore()
  })),
  mercadoPagoWebhook: onRequest({
    ...runtimeOptions,
    invoker: 'public',
    secrets: [mercadoPagoAccessToken, mercadoPagoWebhookSecret]
  }, (request, response) => mercadoPagoWebhookHandler({
    accessToken: mercadoPagoAccessToken.value(),
    firestore: firestore(),
    request,
    response,
    webhookSecret: mercadoPagoWebhookSecret.value()
  })),
  requestClientInvoice: onCall({
    ...runtimeOptions,
    enforceAppCheck
  }, (request) => requestClientInvoiceHandler({
    auth: request.auth,
    data: request.data,
    firestore: firestore()
  })),
  submitPublicAppointmentRequest: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public'
  }, (request) => submitPublicAppointmentRequestHandler({
    data: request.data,
    firestore: firestore(),
    storage: storage()
  }))
});
