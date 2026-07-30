import { HttpsError } from 'firebase-functions/v2/https';

// Define el máximo total de intentos
export const MAX_TICKET_ATTEMPTS = 3;

// Define la espera mínima entre intentos
export const RETRY_COOLDOWN_MS = 60_000;

// Convierte una marca temporal a milisegundos
const getTimestampMillis = (value) => {
  // Reconoce marcas temporales de Firestore
  if (typeof value?.toMillis === 'function') {
    // Devuelve el valor persistido
    return value.toMillis();
  }

  // Reconoce fechas inyectadas en pruebas
  if (value instanceof Date) {
    // Devuelve el valor temporal
    return value.getTime();
  }

  // Devuelve ausencia para datos anteriores
  return null;
};

// Protege la cuota antes de solicitar otro envío
export const requireTicketRetryAvailability = ({
  nowMillis,
  ticket
}) => {
  // Normaliza los intentos confirmados
  const attempts = (
    Number.isSafeInteger(ticket?.intentos)
    && ticket.intentos >= 0
  )
    ? ticket.intentos
    : 0;

  // Detiene reintentos que agotaron el límite
  if (attempts >= MAX_TICKET_ATTEMPTS) {
    throw new HttpsError(
      'resource-exhausted',
      'El ticket alcanzó el límite de tres intentos'
    );
  }

  // Obtiene la última reclamación confirmada
  const lastAttemptMillis = getTimestampMillis(ticket?.ultimoIntentoEn);

  // Evita solicitudes repetidas durante el enfriamiento
  if (
    lastAttemptMillis !== null
    && nowMillis - lastAttemptMillis < RETRY_COOLDOWN_MS
  ) {
    throw new HttpsError(
      'aborted',
      'Espera un minuto antes de volver a intentar'
    );
  }
};
