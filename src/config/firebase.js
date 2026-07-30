import {
  getApp,
  getApps,
  initializeApp
} from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore
} from 'firebase/firestore';
import {
  connectFunctionsEmulator,
  getFunctions
} from 'firebase/functions';

// Define la configuración segura del proyecto
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Detecta el entorno local aislado
const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

// Evita compartir la identidad productiva con el emulador
const activeConfig = useEmulators
  ? { ...firebaseConfig, projectId: 'demo-lumina' }
  : firebaseConfig;

// Reutiliza la aplicación durante recargas de desarrollo
export const app = getApps().length > 0
  ? getApp()
  : initializeApp(activeConfig);

// Expone las fronteras oficiales de Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functionsInstance = getFunctions(app, 'us-central1');

// Conecta una sola vez los servicios locales
if (useEmulators && !globalThis.luminaEmulatorsConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
    disableWarnings: true
  });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functionsInstance, '127.0.0.1', 5001);
  globalThis.luminaEmulatorsConnected = true;
}
