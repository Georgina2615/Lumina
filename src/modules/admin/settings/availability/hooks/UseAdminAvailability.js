import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { manageAdminAvailability } from '../services/AdminAvailabilityCommandService';
import {
  subscribeAdminSlotsByDate,
  subscribeUpcomingAdminBlocks
} from '../services/AdminAvailabilityQueryService';
import {
  BOOKING_TIMES,
  createAvailabilityOperationId,
  getBusinessDateKey,
  hasAvailableSlots,
  resolveAvailabilitySlot
} from '../services/AdminAvailabilityPolicy';

// Controla las lecturas y cambios de disponibilidad
export const useAdminAvailability = () => {
  const todayDateKey = useMemo(() => getBusinessDateKey(), []);
  const [selectedDateKey, setSelectedDateKey] = useState(todayDateKey);
  const [storedSlots, setStoredSlots] = useState([]);
  const [upcomingBlocks, setUpcomingBlocks] = useState([]);
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const mutationRef = useRef(null);
  const pendingOperationRef = useRef(null);

  // Cambia la fecha y prepara la siguiente consulta
  const selectDateKey = useCallback((dateKey) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSelectedDateKey(dateKey);
  }, []);

  // Reinicia las escuchas solicitadas por la usuaria
  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((current) => current + 1);
  }, []);

  const slots = useMemo(() => BOOKING_TIMES.map((bookingTime) => ({
    ...resolveAvailabilitySlot({
      dateKey: selectedDateKey,
      slot: storedSlots.find(({ time }) => time === bookingTime.value),
      time: bookingTime.value
    }),
    label: bookingTime.label
  })), [selectedDateKey, storedSlots]);

  // Abre una accion sin conservar errores anteriores
  const openDialog = useCallback((nextDialog) => {
    setMutationError(null);
    pendingOperationRef.current = null;
    setDialog(nextDialog);
  }, []);

  // Cierra una accion cuando no existe una escritura activa
  const closeDialog = useCallback(() => {
    if (!isMutating) {
      setMutationError(null);
      pendingOperationRef.current = null;
      setDialog(null);
    }
  }, [isMutating]);

  // Escucha la fecha elegida en tiempo real
  useEffect(() => {
    return subscribeAdminSlotsByDate({
      dateKey: selectedDateKey,
      onData: (nextSlots) => {
        setStoredSlots(nextSlots);
        setIsLoading(false);
      },
      onError: () => {
        setError('No se pudo consultar la disponibilidad');
        setIsLoading(false);
      }
    });
  }, [reloadKey, selectedDateKey]);

  // Escucha los bloqueos futuros en tiempo real
  useEffect(() => subscribeUpcomingAdminBlocks({
    fromDateKey: todayDateKey,
    onData: setUpcomingBlocks,
    onError: () => setError('No se pudieron consultar los próximos bloqueos')
  }), [reloadKey, todayDateKey]);

  // Ejecuta una unica escritura a la vez
  const confirmAction = useCallback((reason = '') => {
    if (mutationRef.current || !dialog) {
      return mutationRef.current;
    }

    setIsMutating(true);
    setMutationError(null);

    const signature = JSON.stringify({
      action: dialog.action,
      dateKey: dialog.dateKey,
      reason,
      time: dialog.time ?? null
    });
    const pendingOperation = pendingOperationRef.current;
    const operationId = pendingOperation?.signature === signature
      ? pendingOperation.operationId
      : createAvailabilityOperationId();

    pendingOperationRef.current = { operationId, signature };

    const payload = {
      action: dialog.action,
      dateKey: dialog.dateKey,
      operationId
    };

    if (dialog.action !== 'block_day') {
      payload.time = dialog.time;
    }

    if (dialog.action !== 'reopen_slot') {
      payload.reason = reason;
    }

    const promise = manageAdminAvailability(payload)
      .then((result) => {
        const count = result.affectedSlotIds?.length ?? 0;
        pendingOperationRef.current = null;
        setFeedback(dialog.action === 'reopen_slot'
          ? 'Horario disponible nuevamente'
          : `${count} ${count === 1 ? 'horario bloqueado' : 'horarios bloqueados'}`);
        setDialog(null);
        return result;
      })
      .catch((commandError) => {
        setMutationError(commandError.message);
        throw commandError;
      })
      .finally(() => {
        mutationRef.current = null;
        setIsMutating(false);
      });

    mutationRef.current = promise;
    promise.catch(() => null);
    return promise;
  }, [dialog]);

  // Expone el estado y las acciones visuales
  return {
    canBlockDay: hasAvailableSlots(slots),
    closeDialog,
    confirmAction,
    dialog,
    error,
    feedback,
    isLoading,
    isMutating,
    mutationError,
    openBlockDay: () => openDialog({
      action: 'block_day',
      dateKey: selectedDateKey
    }),
    openBlockSlot: (slot) => openDialog({
      action: 'block_slot',
      dateKey: selectedDateKey,
      time: slot.time
    }),
    openReopenSlot: (slot) => openDialog({
      action: 'reopen_slot',
      dateKey: slot.dateKey,
      reason: slot.reason,
      time: slot.time
    }),
    reload,
    selectedDateKey,
    setFeedback,
    setMutationError,
    setSelectedDateKey: selectDateKey,
    slots,
    todayDateKey,
    upcomingBlocks
  };
};
