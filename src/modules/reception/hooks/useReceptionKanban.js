import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context';
import {
  appointmentStatus,
  cancelAppointment,
  transitionAppointmentStatus
} from '../services/AppointmentService';
import {
  formatDateKey,
  subscribeAppointmentsByStatus
} from '../services/AppointmentQueryService';

// Controla el tablero operativo de recepción
export const useReceptionKanban = () => {
  // Obtiene la identidad responsable
  const { usuario: user } = useAuth();
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  const [inCabinAppointments, setInCabinAppointments] = useState([]);
  const [checkoutAppointments, setCheckoutAppointments] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState({
    pending: true,
    confirmed: true,
    inCabin: true,
    checkout: true
  });
  const [error, setError] = useState(null);
  const [processingAppointmentIds, setProcessingAppointmentIds] = useState(
    () => new Set()
  );
  const [todayKey, setTodayKey] = useState(() => formatDateKey(new Date()));

  useEffect(() => {
    // Calcula el siguiente cambio de día
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);

    // Actualiza el tablero después de medianoche
    const timeoutId = window.setTimeout(() => {
      setTodayKey(formatDateKey(new Date()));
    }, nextDay.getTime() - now.getTime() + 1000);

    // Detiene el temporizador vigente
    return () => window.clearTimeout(timeoutId);
  }, [todayKey]);

  useEffect(() => {
    // Completa la carga de una columna
    const completeColumn = (column) => {
      setLoadingColumns((current) => ({ ...current, [column]: false }));
    };

    // Comunica errores de sincronización
    const handleSubscriptionError = (column, subscriptionError) => {
      console.error('Error al sincronizar el tablero:', subscriptionError);
      setError('No pudimos sincronizar todas las citas');
      completeColumn(column);
    };

    // Escucha las citas pendientes
    const unsubscribePending = subscribeAppointmentsByStatus({
      status: appointmentStatus.pending,
      onData: (appointments) => {
        setPendingAppointments(appointments);
        completeColumn('pending');
      },
      onError: (subscriptionError) => {
        handleSubscriptionError('pending', subscriptionError);
      }
    });

    // Escucha las citas confirmadas del día
    const unsubscribeConfirmed = subscribeAppointmentsByStatus({
      status: appointmentStatus.confirmed,
      dateKey: todayKey,
      onData: (appointments) => {
        setConfirmedAppointments(appointments);
        completeColumn('confirmed');
      },
      onError: (subscriptionError) => {
        handleSubscriptionError('confirmed', subscriptionError);
      }
    });

    // Escucha las citas que están en cabina
    const unsubscribeInCabin = subscribeAppointmentsByStatus({
      status: appointmentStatus.inCabin,
      dateKey: todayKey,
      onData: (appointments) => {
        setInCabinAppointments(appointments);
        completeColumn('inCabin');
      },
      onError: (subscriptionError) => {
        handleSubscriptionError('inCabin', subscriptionError);
      }
    });

    // Escucha todas las citas pendientes de cobro
    const unsubscribeCheckout = subscribeAppointmentsByStatus({
      status: appointmentStatus.checkout,
      onData: (appointments) => {
        setCheckoutAppointments(appointments);
        completeColumn('checkout');
      },
      onError: (subscriptionError) => {
        handleSubscriptionError('checkout', subscriptionError);
      }
    });

    // Detiene todas las suscripciones
    return () => {
      unsubscribePending();
      unsubscribeConfirmed();
      unsubscribeInCabin();
      unsubscribeCheckout();
    };
  }, [todayKey]);

  // Ejecuta una acción protegida
  const runAppointmentAction = async (appointmentId, action) => {
    setError(null);
    setProcessingAppointmentIds((current) => {
      // Crea una colección independiente
      const next = new Set(current);
      next.add(appointmentId);

      // Devuelve las operaciones vigentes
      return next;
    });

    try {
      // Ejecuta la escritura solicitada
      return await action();
    } catch (actionError) {
      console.error('Error al actualizar la cita:', actionError);
      setError(actionError.message || 'No pudimos actualizar la cita');
      throw actionError;
    } finally {
      setProcessingAppointmentIds((current) => {
        // Crea una colección independiente
        const next = new Set(current);
        next.delete(appointmentId);

        // Devuelve las operaciones vigentes
        return next;
      });
    }
  };

  // Cambia el estado de una cita
  const updateAppointmentStatus = (appointmentId, nextStatus) => {
    // Devuelve la operación de transición
    return runAppointmentAction(appointmentId, () => (
      transitionAppointmentStatus({
        appointmentId,
        nextStatus,
        actorUid: user?.uid
      })
    ));
  };

  // Confirma una cita pendiente
  const confirmAppointment = (appointmentId) => {
    // Devuelve la transición de confirmación
    return updateAppointmentStatus(appointmentId, appointmentStatus.confirmed);
  };

  // Envía una cita confirmada a cabina
  const moveAppointmentToCabin = (appointmentId) => {
    // Devuelve la transición hacia cabina
    return updateAppointmentStatus(appointmentId, appointmentStatus.inCabin);
  };

  // Envía una cita atendida al cobro
  const moveAppointmentToCheckout = (appointmentId) => {
    // Envía la cita a la bandeja de cobro
    return updateAppointmentStatus(
      appointmentId,
      appointmentStatus.checkout
    );
  };

  // Cancela una cita con motivo
  const cancelReceptionAppointment = (appointmentId, reason) => {
    // Devuelve la operación de cancelación
    return runAppointmentAction(appointmentId, () => (
      cancelAppointment({
        appointmentId,
        reason,
        actorUid: user?.uid
      })
    ));
  };

  // Limpia el mensaje de error
  const clearError = () => {
    setError(null);
  };

  // Calcula la carga general
  const loading = Object.values(loadingColumns).some(Boolean);

  // Comprueba el proceso de una cita
  const isProcessingAppointment = (appointmentId) => {
    // Devuelve el estado de procesamiento
    return processingAppointmentIds.has(appointmentId);
  };

  // Devuelve el estado del tablero
  return {
    pendingAppointments,
    confirmedAppointments,
    inCabinAppointments,
    checkoutAppointments,
    loading,
    error,
    isProcessingAppointment,
    confirmAppointment,
    moveAppointmentToCabin,
    moveAppointmentToCheckout,
    cancelReceptionAppointment,
    clearError
  };
};
