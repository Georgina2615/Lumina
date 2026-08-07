import { onCall } from 'firebase-functions/v2/https';
import { manageSkinTestConfigHandler } from './ManageSkinTestConfig.js';

// Expone la configuración protegida del test
export const createSkinTestConfigFunction = ({
  enforceAppCheck,
  firestore,
  runtimeOptions
}) => onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageSkinTestConfigHandler({
  auth: request.auth,
  data: request.data,
  firestore: firestore()
}));
