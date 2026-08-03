import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  actionableTicketStatuses,
  isTicketStatus,
  normalizeSafeText,
  normalizeTicketAttempts,
  normalizeTimestampMillis,
  requireSaleId
} from './SaleTicketPolicy';

// Convierte el documento al contrato visual mínimo
const mapSaleTicket = (snapshot) => {
  // Detecta una venta ausente
  if (!snapshot.exists()) {
    throw new Error('La venta confirmada ya no está disponible');
  }

  // Lee únicamente campos permitidos
  const data = snapshot.data();
  // Lee el estado persistido
  const storedStatus = data.ticket?.estado;

  // Rechaza estados desconocidos
  if (!isTicketStatus(storedStatus)) {
    throw new Error('El comprobante necesita revisión');
  }

  // Devuelve el estado seguro
  return {
    attempts: normalizeTicketAttempts(data.ticket?.intentos),
    clientName: normalizeSafeText(data.clienteNombre, 160)
      || 'Mostrador',
    createdAt: normalizeTimestampMillis(data.creadaEn),
    folio: normalizeSafeText(data.folio, 80) || snapshot.id,
    lastAttemptAt: normalizeTimestampMillis(
      data.ticket?.ultimoIntentoEn
    ),
    lastError: normalizeSafeText(data.ticket?.ultimoError, 300),
    saleId: snapshot.id,
    ticketStatus: storedStatus,
    recipientEmail: normalizeSafeText(data.clienteEmail, 254)
  };
};

// Traduce fallos de lectura a mensajes operativos
const getObservationErrorMessage = (error) => {
  // Explica permisos insuficientes
  if (error?.code === 'permission-denied') {
    // Devuelve un mensaje seguro
    return 'No tienes permisos para consultar el comprobante';
  }

  // Explica una conexión ausente
  if (error?.code === 'unavailable') {
    // Devuelve un mensaje seguro
    return 'No hay conexión para actualizar el comprobante';
  }

  // Conserva errores locales ya controlados
  if (!error?.code && typeof error?.message === 'string') {
    // Devuelve un texto limitado
    return normalizeSafeText(error.message, 300);
  }

  // Oculta detalles técnicos inesperados
  return 'No se pudo actualizar el comprobante';
};

// Escucha el estado real del ticket confirmado
export const subscribeSaleTicket = ({
  saleId,
  onData,
  onError
}) => {
  // Valida el identificador solicitado
  const normalizedSaleId = requireSaleId(saleId);

  // Devuelve la limpieza de la suscripción
  return onSnapshot(
    doc(db, 'ventas', normalizedSaleId),
    (snapshot) => {
      try {
        onData(mapSaleTicket(snapshot));
      } catch (error) {
        onError(error);
      }
    },
    (error) => onError(new Error(
      getObservationErrorMessage(error),
      { cause: error }
    ))
  );
};

// Ordena el subconjunto recibido por actividad reciente
const sortActionableTickets = (tickets) => (
  [...tickets].sort((first, second) => (
    (second.lastAttemptAt ?? second.createdAt ?? 0)
    - (first.lastAttemptAt ?? first.createdAt ?? 0)
    || second.saleId.localeCompare(first.saleId, 'es')
  ))
);

// Escucha una cola acotada sin índice compuesto
export const subscribeActionableSaleTickets = ({
  onData,
  onError
}) => (
  onSnapshot(
    query(
      collection(db, 'ventas'),
      where('ticket.estado', 'in', actionableTicketStatuses),
      orderBy('ticket.ultimoIntentoEn', 'desc'),
      limit(20)
    ),
    (snapshot) => {
      try {
        // Convierte únicamente ventas accionables
        const tickets = snapshot.docs.map(mapSaleTicket);

        // Devuelve el subconjunto ordenado
        onData(sortActionableTickets(tickets));
      } catch (error) {
        onError(error);
      }
    },
    (error) => onError(new Error(
      getObservationErrorMessage(error),
      { cause: error }
    ))
  )
);
