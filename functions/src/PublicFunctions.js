import { onCall } from 'firebase-functions/v2/https';
import {
  getPublicAvailabilityHandler
} from './GetPublicAvailability.js';
import { getClientAccountHandler } from './GetClientAccount.js';
import {
  submitPublicAppointmentRequestHandler
} from './SubmitPublicAppointmentRequest.js';
import {
  evaluatePublicSkinTestHandler,
  getPublicSkinTestHandler
} from './PublicSkinTest.js';

// Expone las funciones protegidas del sitio publico
export const createPublicFunctions = ({
  enforceAppCheck,
  firestore,
  runtimeOptions,
  storage
}) => ({
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
  getPublicSkinTest: onCall({
    ...runtimeOptions,
    enforceAppCheck,
    invoker: 'public'
  }, () => getPublicSkinTestHandler({
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
