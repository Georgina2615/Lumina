import { onCall } from 'firebase-functions/v2/https';
import {
  getPublicAvailabilityHandler
} from './GetPublicAvailability.js';
import { getClientAccountHandler } from './GetClientAccount.js';
import {
  submitPublicAppointmentRequestHandler
} from './SubmitPublicAppointmentRequest.js';

// Expone las funciones protegidas del sitio publico
export const createPublicFunctions = ({
  enforceAppCheck,
  firestore,
  runtimeOptions,
  storage
}) => ({
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
