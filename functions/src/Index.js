import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { finalizeReceptionSaleHandler } from './FinalizeReceptionSale.js';

initializeApp();

// Obtiene la configuración del proceso
const environment = globalThis.process?.env ?? {};

// Detecta la ejecución local de funciones
const isEmulator = environment.FUNCTIONS_EMULATOR === 'true';

// Obtiene la decisión explícita para pruebas
const enforceEmulatorAppCheck = (
  environment.ENFORCE_APP_CHECK_IN_EMULATOR === 'true'
);

// Protege producción y permite pruebas locales controladas
const enforceAppCheck = !isEmulator || enforceEmulatorAppCheck;

// Finaliza una venta presencial de manera atómica
export const finalizeReceptionSale = onCall({
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
  minInstances: 0,
  maxInstances: 1,
  enforceAppCheck
}, (request) => finalizeReceptionSaleHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));
