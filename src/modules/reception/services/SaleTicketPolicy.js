// Define todos los estados conocidos
const ticketStatuses = new Set([
  'pendiente',
  'enviando',
  'enviado',
  'fallido',
  'omitido',
  'no_confirmado'
]);

// Define los estados que requieren intervención
export const actionableTicketStatuses = Object.freeze([
  'fallido',
  'no_confirmado'
]);

// Define el máximo compartido con el servidor
export const maxTicketAttempts = 3;

// Define el enfriamiento compartido con el servidor
export const ticketRetryCooldownMs = 60_000;

// Reconoce un estado permitido
export const isTicketStatus = (value) => ticketStatuses.has(value);

// Reconoce un estado con acciones manuales
export const isActionableTicketStatus = (value) => (
  actionableTicketStatuses.includes(value)
);

// Valida un identificador antes de consultar
export const requireSaleId = (saleId) => {
  // Normaliza el identificador recibido
  const normalizedSaleId = String(saleId ?? '').trim();

  // Rechaza identificadores manipulados
  if (!/^[A-Za-z0-9_-]{1,250}$/.test(normalizedSaleId)) {
    throw new Error('El identificador de la venta no es válido');
  }

  // Devuelve el identificador seguro
  return normalizedSaleId;
};

// Limita textos remotos para la interfaz
export const normalizeSafeText = (value, maximumLength) => (
  typeof value === 'string'
    ? value.trim().slice(0, maximumLength)
    : ''
);

// Convierte marcas temporales de Firestore
export const normalizeTimestampMillis = (value) => {
  // Reconoce una marca temporal válida
  if (typeof value?.toMillis === 'function') {
    // Devuelve milisegundos seguros
    return value.toMillis();
  }

  // Devuelve ausencia para datos heredados
  return null;
};

// Normaliza el contador de intentos
export const normalizeTicketAttempts = (value) => (
  Number.isSafeInteger(value) && value >= 0 ? value : 0
);

// Calcula la disponibilidad local del reintento
export const getTicketRetryAvailability = (ticket, nowMillis) => {
  // Normaliza el contador vigente
  const attempts = normalizeTicketAttempts(ticket?.attempts);
  // Detecta el límite definitivo
  const exhausted = attempts >= maxTicketAttempts;
  // Obtiene la última reclamación real
  const lastAttemptAt = Number.isFinite(ticket?.lastAttemptAt)
    ? ticket.lastAttemptAt
    : null;
  // Calcula la espera restante
  const remainingMilliseconds = lastAttemptAt === null
    ? 0
    : Math.max(
      0,
      ticketRetryCooldownMs - (nowMillis - lastAttemptAt)
    );
  // Redondea el tiempo para la vista
  const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
  // Detecta el enfriamiento vigente
  const coolingDown = !exhausted && remainingSeconds > 0;
  // Explica un bloqueo local
  const blockedReason = exhausted
    ? 'Límite de tres intentos alcanzado'
    : coolingDown
      ? `Espera ${remainingSeconds} segundos`
      : '';

  // Devuelve la política calculada
  return {
    attempts,
    blockedReason,
    canRetry: !exhausted && !coolingDown,
    coolingDown,
    exhausted,
    remainingSeconds
  };
};
