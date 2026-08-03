import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../config/firebase';
import {
  isTicketStatus,
  normalizeSafeText,
  requireSaleId
} from './SaleTicketPolicy';

// Define las resoluciones manuales permitidas
const resolutionActions = new Set(['confirmed', 'retry']);

// Prepara el reintento de un fallo confirmado
const retrySaleTicketCallable = httpsCallable(
  functionsInstance,
  'retrySaleTicket'
);

// Prepara la resolución de un envío ambiguo
const resolveSaleTicketCallable = httpsCallable(
  functionsInstance,
  'resolveUnconfirmedSaleTicket'
);

// Limpia mensajes remotos controlados
const normalizeRemoteMessage = (value) => (
  normalizeSafeText(value, 300)
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(functions\/[a-z-]+\)\.?\s*$/i, '')
    .trim()
);

// Traduce fallos remotos a mensajes operativos
const getTicketActionErrorMessage = (error) => {
  // Explica permisos insuficientes
  if (error?.code === 'functions/permission-denied') {
    // Devuelve un mensaje seguro
    return 'No tienes permisos para actualizar este comprobante';
  }

  // Explica una sesión ausente
  if (error?.code === 'functions/unauthenticated') {
    // Devuelve un mensaje seguro
    return 'Inicia sesión para actualizar el comprobante';
  }

  // Explica una función ausente
  if (error?.code === 'functions/not-found') {
    // Devuelve un mensaje seguro
    return 'No se puede actualizar el comprobante por el momento';
  }

  // Explica una conexión ausente
  if (error?.code === 'functions/unavailable') {
    // Devuelve un mensaje seguro
    return 'No hay conexión para actualizar el comprobante';
  }

  // Explica el límite definitivo
  if (error?.code === 'functions/resource-exhausted') {
    // Devuelve un mensaje seguro
    return 'El comprobante alcanzó el límite de tres intentos';
  }

  // Explica el enfriamiento operativo
  if (error?.code === 'functions/aborted') {
    // Devuelve un mensaje seguro
    return 'Espera un minuto antes de volver a intentar';
  }

  // Explica un estado que cambió
  if (error?.code === 'functions/failed-precondition') {
    // Devuelve un mensaje seguro
    return 'El comprobante cambió. Actualiza la pantalla e inténtalo de nuevo';
  }

  // Obtiene un mensaje remoto seguro
  const remoteMessage = error?.details?.message || error?.message;

  // Devuelve el mejor mensaje disponible
  return normalizeRemoteMessage(remoteMessage)
    || 'No se pudo actualizar el comprobante';
};

// Valida la respuesta mínima de una acción
const mapTicketActionResult = (data, saleId) => {
  // Rechaza respuestas incompletas
  if (
    !data
    || data.saleId !== saleId
    || !isTicketStatus(data.ticketStatus)
  ) {
    throw new Error('La función devolvió una respuesta incompleta');
  }

  // Devuelve únicamente campos seguros
  return {
    action: typeof data.action === 'string' ? data.action : null,
    saleId: data.saleId,
    sent: data.sent === true,
    ticketStatus: data.ticketStatus
  };
};

// Ejecuta una acción remota protegida
const runTicketAction = async ({
  callable,
  payload,
  saleId
}) => {
  try {
    // Ejecuta la función seleccionada
    const response = await callable(payload);

    // Devuelve la respuesta validada
    return mapTicketActionResult(response.data, saleId);
  } catch (error) {
    throw new Error(
      getTicketActionErrorMessage(error),
      { cause: error }
    );
  }
};

// Solicita el reintento de un fallo confirmado
export const retrySaleTicket = async (saleId) => {
  // Valida la venta solicitada
  const normalizedSaleId = requireSaleId(saleId);

  // Devuelve la acción remota
  return runTicketAction({
    callable: retrySaleTicketCallable,
    payload: { saleId: normalizedSaleId },
    saleId: normalizedSaleId
  });
};

// Resuelve un envío que requiere verificación
export const resolveSaleTicket = async (saleId, action) => {
  // Valida la venta solicitada
  const normalizedSaleId = requireSaleId(saleId);

  // Rechaza acciones desconocidas
  if (!resolutionActions.has(action)) {
    throw new Error('No se pudo actualizar el comprobante');
  }

  // Devuelve la acción remota
  return runTicketAction({
    callable: resolveSaleTicketCallable,
    payload: { saleId: normalizedSaleId, action },
    saleId: normalizedSaleId
  });
};
