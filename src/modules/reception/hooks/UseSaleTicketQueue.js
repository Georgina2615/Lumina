import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useAuth } from '../../auth/context';
import {
  resolveSaleTicket,
  restartSaleTicket,
  retrySaleTicket
} from '../services/SaleTicketActionService';
import {
  getTicketRetryAvailability,
  maxTicketAttempts,
  ticketRetryCooldownMs
} from '../services/SaleTicketPolicy';
import {
  subscribeActionableSaleTickets
} from '../services/SaleTicketService';
import { useTicketClock } from './UseTicketClock';

// Define el estado inicial de la cola
const initialQueueState = {
  error: null,
  loading: true,
  tickets: []
};

// Conserva únicamente acciones todavía visibles
const pruneActionStates = (current, tickets) => {
  // Reúne los identificadores vigentes
  const visibleSaleIds = new Set(
    tickets.map((ticket) => ticket.saleId)
  );
  // Filtra acciones resueltas
  const nextEntries = Object.entries(current).filter(
    ([saleId]) => visibleSaleIds.has(saleId)
  );

  // Devuelve el mapa reducido
  return Object.fromEntries(nextEntries);
};

// Controla la cola persistente de tickets
export const useSaleTicketQueue = () => {
  // Obtiene el rol vigente sin duplicar permisos
  const { rol: role } = useAuth();
  // Conserva las ventas accionables
  const [queueState, setQueueState] = useState(initialQueueState);
  // Conserva acciones aisladas por venta
  const [actionStates, setActionStates] = useState({});
  // Evita acciones duplicadas por venta
  const actionLocksRef = useRef(new Set());

  // Mantiene la cola sincronizada
  useEffect(() => (
    subscribeActionableSaleTickets({
      onData: (tickets) => {
        setQueueState({
          error: null,
          loading: false,
          tickets
        });
        setActionStates((current) => (
          pruneActionStates(current, tickets)
        ));
      },
      onError: (error) => {
        setQueueState((current) => ({
          ...current,
          error: error?.message || 'No se pudo actualizar la cola',
          loading: false
        }));
      }
    })
  ), []);

  // Calcula la última espera todavía relevante
  const retryDeadline = queueState.tickets.reduce(
    (latestDeadline, ticket) => (
      ticket.attempts < maxTicketAttempts
      && ticket.lastAttemptAt !== null
        ? Math.max(
          latestDeadline,
          ticket.lastAttemptAt + ticketRetryCooldownMs
        )
        : latestDeadline
    ),
    0
  ) || null;
  // Comparte un solo reloj con toda la cola
  const nowMillis = useTicketClock(retryDeadline);

  // Compone la vista sin alterar documentos
  const tickets = useMemo(() => (
    queueState.tickets.map((ticket) => ({
      ...ticket,
      actionState: actionStates[ticket.saleId] ?? {
        action: null,
        error: null,
        processing: false
      },
      retryAvailability: getTicketRetryAvailability(
        ticket,
        nowMillis
      ),
      canRestart: role === 'admin'
        && ticket.ticketStatus === 'fallido'
        && ticket.attempts >= maxTicketAttempts
    }))
  ), [actionStates, nowMillis, queueState.tickets, role]);

  // Ejecuta una acción sobre la venta vigente
  const runAction = useCallback(async (saleId, action, reason = '') => {
    // Localiza el ticket autoritativo
    const ticket = queueState.tickets.find(
      (item) => item.saleId === saleId
    );

    // Evita acciones ausentes o duplicadas
    if (!ticket || actionLocksRef.current.has(saleId)) {
      // Detiene la acción inválida
      return;
    }

    // Calcula la disponibilidad al pulsar
    const retryAvailability = getTicketRetryAvailability(
      ticket,
      Date.now()
    );

    // Protege reintentos bloqueados
    if (action === 'retry' && !retryAvailability.canRetry) {
      // Detiene el reintento local
      return;
    }

    // Protege reactivaciones fuera de administración
    if (
      action === 'restart'
      && (
        role !== 'admin'
        || ticket.ticketStatus !== 'fallido'
        || !retryAvailability.exhausted
      )
    ) {
      // Detiene la reactivación inválida
      return;
    }

    // Protege confirmaciones fuera del estado ambiguo
    if (
      action === 'confirmed'
      && ticket.ticketStatus !== 'no_confirmado'
    ) {
      // Detiene la confirmación inválida
      return;
    }

    actionLocksRef.current.add(saleId);
    setActionStates((current) => ({
      ...current,
      [saleId]: {
        action,
        error: null,
        processing: true
      }
    }));

    try {
      // Selecciona el contrato correcto
      if (action === 'restart') {
        await restartSaleTicket(saleId, reason);
      } else if (ticket.ticketStatus === 'fallido') {
        await retrySaleTicket(saleId);
      } else {
        await resolveSaleTicket(saleId, action);
      }
      // Libera la acción mientras llega el siguiente snapshot
      setActionStates((current) => ({
        ...current,
        [saleId]: {
          action,
          error: null,
          processing: false
        }
      }));
    } catch (error) {
      setActionStates((current) => ({
        ...current,
        [saleId]: {
          action,
          error: error.message || 'No se pudo actualizar el comprobante',
          processing: false
        }
      }));
    } finally {
      actionLocksRef.current.delete(saleId);
    }
  }, [queueState.tickets, role]);

  // Confirma una entrega verificada
  const confirmDelivery = useCallback((saleId) => (
    runAction(saleId, 'confirmed')
  ), [runAction]);

  // Solicita un nuevo intento
  const retry = useCallback((saleId) => (
    runAction(saleId, 'retry')
  ), [runAction]);

  // Solicita tres intentos nuevos con autorización administrativa
  const restart = useCallback((saleId, reason) => (
    runAction(saleId, 'restart', reason)
  ), [runAction]);

  // Devuelve el contrato de la cola
  return {
    confirmDelivery,
    error: queueState.error,
    loading: queueState.loading,
    restart,
    retry,
    tickets
  };
};
