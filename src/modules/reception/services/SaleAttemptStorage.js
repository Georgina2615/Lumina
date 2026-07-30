// Define el espacio temporal de la pestaña
const storagePrefix = 'luminaReceptionSaleAttempt';

// Construye una clave aislada por origen
const buildStorageKey = (appointmentId) => (
  `${storagePrefix}:${appointmentId || 'walkin'}`
);

// Comprueba la forma mínima del intento
const isValidStoredAttempt = (attempt, appointmentId) => (
  attempt?.schemaVersion === 1
  && attempt.request?.appointmentId === (appointmentId || null)
  && typeof attempt.request?.idempotencyKey === 'string'
  && Array.isArray(attempt.request?.payments)
  && Array.isArray(attempt.request?.productItems)
  && Array.isArray(attempt.view?.cartItems)
  && Number.isSafeInteger(attempt.view?.totals?.amountDueCents)
  && attempt.view?.paymentForm
  && typeof attempt.view.paymentForm === 'object'
);

// Lee un intento pendiente de la pestaña
export const readSaleAttempt = (appointmentId) => {
  // Omite almacenamiento fuera del navegador
  if (typeof window === 'undefined') {
    // Devuelve ausencia segura
    return null;
  }
  // Intenta recuperar únicamente datos válidos
  try {
    // Lee el contenido serializado
    const storedValue = window.sessionStorage.getItem(
      buildStorageKey(appointmentId)
    );
    // Detiene la lectura cuando no existe contenido
    if (!storedValue) {
      // Devuelve ausencia real
      return null;
    }
    // Convierte el contenido guardado
    const attempt = JSON.parse(storedValue);
    // Devuelve solo intentos compatibles
    return isValidStoredAttempt(attempt, appointmentId)
      ? attempt
      : null;
  } catch {
    // Devuelve ausencia cuando el navegador bloquea el almacenamiento
    return null;
  }
};

// Guarda un intento hasta obtener respuesta definitiva
export const storeSaleAttempt = (appointmentId, attempt) => {
  // Omite almacenamiento fuera del navegador
  if (typeof window === 'undefined') {
    // Detiene la operación segura
    return;
  }
  try {
    window.sessionStorage.setItem(
      buildStorageKey(appointmentId),
      JSON.stringify({ ...attempt, schemaVersion: 1 })
    );
  } catch {
    // Conserva la protección disponible en memoria
  }
};

// Elimina un intento resuelto
export const clearSaleAttempt = (appointmentId) => {
  // Omite almacenamiento fuera del navegador
  if (typeof window === 'undefined') {
    // Detiene la operación segura
    return;
  }
  try {
    window.sessionStorage.removeItem(buildStorageKey(appointmentId));
  } catch {
    // Conserva el cierre aunque el navegador bloquee el almacenamiento
  }
};
