import { useCallback, useState } from 'react';
import {
  appointmentAction,
  manageReceptionAppointment
} from '../services/AppointmentWorkflowService';

// Controla las acciones remotas de las citas
export const useReceptionAppointmentActions = () => {
  // Conserva las operaciones activas
  const [processingAppointmentIds, setProcessingAppointmentIds] = useState(
    () => new Set()
  );
  const [error, setError] = useState(null);

  // Cambia el estado local de una operación
  const setAppointmentProcessing = useCallback((appointmentId, processing) => {
    setProcessingAppointmentIds((current) => {
      const next = new Set(current);

      if (processing) {
        next.add(appointmentId);
      } else {
        next.delete(appointmentId);
      }

      return next;
    });
  }, []);

  // Ejecuta una acción protegida
  const runAppointmentAction = useCallback(async (
    appointmentId,
    request
  ) => {
    setError(null);
    setAppointmentProcessing(appointmentId, true);

    try {
      // Envía la intención al servidor
      return await manageReceptionAppointment({
        appointmentId,
        ...request
      });
    } catch (actionError) {
      console.error('Error al actualizar la cita', actionError);
      setError(actionError.message || 'No pudimos actualizar la cita');
      throw actionError;
    } finally {
      setAppointmentProcessing(appointmentId, false);
    }
  }, [setAppointmentProcessing]);

  // Confirma la asistencia por el canal registrado
  const confirmAppointment = useCallback((appointmentId, channel) => (
    runAppointmentAction(appointmentId, {
      action: appointmentAction.confirm,
      channel
    })
  ), [runAppointmentAction]);

  // Envía la cita confirmada a cabina
  const moveAppointmentToCabin = useCallback((appointmentId) => (
    runAppointmentAction(appointmentId, {
      action: appointmentAction.moveToCabin
    })
  ), [runAppointmentAction]);

  // Cancela una cita con origen y motivo
  const cancelReceptionAppointment = useCallback((
    appointmentId,
    { origin, reason }
  ) => (
    runAppointmentAction(appointmentId, {
      action: appointmentAction.cancel,
      origin,
      reason
    })
  ), [runAppointmentAction]);

  // Registra una inasistencia con su motivo
  const markAppointmentNoShow = useCallback((appointmentId, reason) => (
    runAppointmentAction(appointmentId, {
      action: appointmentAction.markNoShow,
      reason
    })
  ), [runAppointmentAction]);

  // Comprueba si una cita tiene una operación activa
  const isProcessingAppointment = useCallback((appointmentId) => (
    processingAppointmentIds.has(appointmentId)
  ), [processingAppointmentIds]);

  // Limpia el error de acciones
  const clearActionError = useCallback(() => {
    setError(null);
  }, []);

  // Devuelve las acciones y su estado
  return {
    actionError: error,
    isProcessing: processingAppointmentIds.size > 0,
    isProcessingAppointment,
    confirmAppointment,
    moveAppointmentToCabin,
    cancelReceptionAppointment,
    markAppointmentNoShow,
    clearActionError
  };
};
