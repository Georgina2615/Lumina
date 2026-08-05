import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onCall } from 'firebase-functions/v2/https';
import { manageClinicalConsentHandler } from './ManageClinicalConsent.js';
import { manageCareRecommendationHandler } from './ManageCareRecommendation.js';
import { manageClinicalRecordHandler } from './ManageClinicalRecord.js';
import { manageClinicalSessionHandler } from './ManageClinicalSession.js';
import { recordCabinConsumptionHandler } from './RecordCabinConsumption.js';

// Registra las funciones del flujo clínico
export const createClinicalFunctions = ({ enforceAppCheck, runtimeOptions }) => ({
  manageCareRecommendation: onCall({ ...runtimeOptions, enforceAppCheck }, (request) => manageCareRecommendationHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore()
  })),
  manageClinicalConsent: onCall({ ...runtimeOptions, enforceAppCheck }, (request) => manageClinicalConsentHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore(),
    storage: getStorage()
  })),
  manageClinicalRecord: onCall({ ...runtimeOptions, enforceAppCheck }, (request) => manageClinicalRecordHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore()
  })),
  manageClinicalSession: onCall({ ...runtimeOptions, enforceAppCheck }, (request) => manageClinicalSessionHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore(),
    storage: getStorage()
  })),
  recordCabinConsumption: onCall({ ...runtimeOptions, enforceAppCheck }, (request) => recordCabinConsumptionHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore()
  }))
});
