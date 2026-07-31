import { useEffect, useState } from 'react';
import { appointmentStatus } from '../services/AppointmentService';
import {
  subscribeAppointmentsByStatus,
  subscribeAppointmentsByStatusAndDates
} from '../services/AppointmentQueryService';

// Define el estado inicial de carga
const initialLoadingColumns = {
  pending: true,
  confirmed: true,
  inCabin: true,
  checkout: true
};

// Escucha las columnas operativas sin ejecutar acciones
export const useReceptionKanbanData = ({ todayKey, tomorrowKey }) => {
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [confirmedAppointments, setConfirmedAppointments] = useState([]);
  const [inCabinAppointments, setInCabinAppointments] = useState([]);
  const [checkoutAppointments, setCheckoutAppointments] = useState([]);
  const [loadingColumns, setLoadingColumns] = useState(initialLoadingColumns);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    // Completa la carga de una columna
    const completeColumn = (column) => {
      setLoadingColumns((current) => ({ ...current, [column]: false }));
    };

    // Comunica errores de sincronización
    const handleError = (column, error) => {
      console.error('Error al sincronizar el tablero', error);
      setSyncError('No pudimos sincronizar todas las citas');
      completeColumn(column);
    };

    // Escucha pendientes de hoy y mañana
    const unsubscribePending = subscribeAppointmentsByStatusAndDates({
      status: appointmentStatus.pending,
      dateKeys: [todayKey, tomorrowKey],
      onData: (appointments) => {
        setPendingAppointments(appointments);
        completeColumn('pending');
      },
      onError: (error) => handleError('pending', error)
    });

    // Escucha confirmadas de hoy
    const unsubscribeConfirmed = subscribeAppointmentsByStatus({
      status: appointmentStatus.confirmed,
      dateKey: todayKey,
      onData: (appointments) => {
        setConfirmedAppointments(appointments);
        completeColumn('confirmed');
      },
      onError: (error) => handleError('confirmed', error)
    });

    // Conserva visibles todas las citas que sigan en cabina
    const unsubscribeInCabin = subscribeAppointmentsByStatus({
      status: appointmentStatus.inCabin,
      onData: (appointments) => {
        setInCabinAppointments(appointments);
        completeColumn('inCabin');
      },
      onError: (error) => handleError('inCabin', error)
    });

    // Escucha citas pendientes de cobro
    const unsubscribeCheckout = subscribeAppointmentsByStatus({
      status: appointmentStatus.checkout,
      onData: (appointments) => {
        setCheckoutAppointments(appointments);
        completeColumn('checkout');
      },
      onError: (error) => handleError('checkout', error)
    });

    // Detiene todas las suscripciones
    return () => {
      unsubscribePending();
      unsubscribeConfirmed();
      unsubscribeInCabin();
      unsubscribeCheckout();
    };
  }, [todayKey, tomorrowKey]);

  // Devuelve el estado sincronizado
  return {
    pendingAppointments,
    confirmedAppointments,
    inCabinAppointments,
    checkoutAppointments,
    loading: Object.values(loadingColumns).some(Boolean),
    syncError,
    clearSyncError: () => setSyncError(null)
  };
};
