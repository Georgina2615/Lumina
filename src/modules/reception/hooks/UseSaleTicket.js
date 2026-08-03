import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  resolveSaleTicket,
  retrySaleTicket
} from '../services/SaleTicketActionService';
import {
  getTicketRetryAvailability,
  isActionableTicketStatus,
  maxTicketAttempts,
  ticketRetryCooldownMs
} from '../services/SaleTicketPolicy';
import { subscribeSaleTicket } from '../services/SaleTicketService';
import { useTicketClock } from './UseTicketClock';

// Normaliza la respuesta inicial de la venta
const buildInitialTicket = (saleResult) => ({
  attempts: 0,
  lastAttemptAt: null,
  lastError: '',
  ticketStatus: saleResult?.ticketStatus || 'pendiente',
  recipientEmail: saleResult?.recipientEmail || ''
});

// Controla la observación y el reintento del ticket
export const useSaleTicket = (saleResult) => {
  // Obtiene la venta confirmada
  const saleId = saleResult?.saleId || '';
  // Conserva actualizaciones asociadas a su venta
  const [ticketState, setTicketState] = useState(null);
  // Conserva errores de observación
  const [observationState, setObservationState] = useState(null);
  // Conserva el estado de la acción manual
  const [actionState, setActionState] = useState(null);
  // Evita solicitudes manuales duplicadas
  const actionLockRef = useRef(false);
  // Usa la actualización solo para la venta vigente
  const currentTicket = ticketState?.saleId === saleId
    ? ticketState.data
    : buildInitialTicket(saleResult);
  // Usa el error solo para la venta vigente
  const observationError = observationState?.saleId === saleId
    ? observationState.message
    : null;
  // Detecta un estado con intervención manual
  const isActionable = isActionableTicketStatus(
    currentTicket.ticketStatus
  );
  // Usa la acción solo para la venta vigente
  const currentAction = actionState?.saleId === saleId
    ? actionState
    : { action: null, error: null, processing: false };
  // Calcula la fecha límite del enfriamiento
  const retryDeadline = (
    isActionable
    && currentTicket.attempts < maxTicketAttempts
    && currentTicket.lastAttemptAt !== null
  )
    ? currentTicket.lastAttemptAt + ticketRetryCooldownMs
    : null;
  // Obtiene el reloj local compartido
  const nowMillis = useTicketClock(retryDeadline);
  // Calcula límites sin sustituir al servidor
  const retryAvailability = getTicketRetryAvailability(
    currentTicket,
    nowMillis
  );

  // Mantiene el ticket sincronizado con Firestore
  useEffect(() => {
    // Omite una respuesta incompleta
    if (!saleId) {
      // Devuelve ausencia de limpieza
      return undefined;
    }

    // Devuelve la limpieza de la venta
    return subscribeSaleTicket({
      saleId,
      onData: (data) => {
        setTicketState({ saleId, data });
        setObservationState(null);
        // Limpia acciones que ya fueron resueltas
        if (!isActionableTicketStatus(data.ticketStatus)) {
          setActionState(null);
        }
      },
      onError: (error) => {
        setObservationState({
          saleId,
          message: error?.message || 'No se pudo actualizar el comprobante'
        });
      }
    });
  }, [saleId]);

  // Ejecuta una acción sin reemplazar el snapshot
  const runAction = useCallback(async (action) => {
    // Evita acciones fuera del estado permitido
    if (
      !saleId
      || !isActionable
      || actionLockRef.current
    ) {
      // Detiene la acción inválida
      return;
    }

    // Protege los reintentos bloqueados
    if (action === 'retry' && !retryAvailability.canRetry) {
      // Detiene el reintento local
      return;
    }

    // Protege la confirmación fuera del estado ambiguo
    if (
      action === 'confirmed'
      && currentTicket.ticketStatus !== 'no_confirmado'
    ) {
      // Detiene la confirmación inválida
      return;
    }

    actionLockRef.current = true;
    setActionState({
      action,
      error: null,
      processing: true,
      saleId
    });
    try {
      // Resuelve según el estado autoritativo
      if (currentTicket.ticketStatus === 'fallido') {
        await retrySaleTicket(saleId);
      } else {
        await resolveSaleTicket(saleId, action);
      }
      // Libera la acción sin reemplazar el estado observado
      setActionState({
        action,
        saleId,
        error: null,
        processing: false
      });
    } catch (error) {
      setActionState({
        action,
        saleId,
        error: error.message || 'No se pudo reenviar el comprobante',
        processing: false
      });
    } finally {
      actionLockRef.current = false;
    }
  }, [
    currentTicket.ticketStatus,
    isActionable,
    retryAvailability.canRetry,
    saleId
  ]);

  // Confirma una entrega revisada por recepción
  const confirmDelivery = useCallback(() => (
    runAction('confirmed')
  ), [runAction]);

  // Solicita un nuevo intento permitido
  const retry = useCallback(() => (
    runAction('retry')
  ), [runAction]);

  // Oculta errores manuales fuera de estados accionables
  const actionError = isActionable ? currentAction.error : null;

  // Devuelve el contrato para la vista
  return {
    ...currentTicket,
    action: currentAction.action,
    actionError,
    confirmDelivery,
    observationError,
    retry,
    retryAvailability,
    processingAction: currentAction.processing
  };
};
