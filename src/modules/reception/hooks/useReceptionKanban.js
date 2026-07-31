import { useMemo } from 'react';
import {
  canMarkAppointmentNoShow,
  filterOperationalPendingAppointments
} from '../services/AppointmentService';
import { formatDateKey } from '../services/AppointmentQueryService';
import { useAppointmentClientContacts } from './UseAppointmentClientContacts';
import {
  useReceptionAppointmentActions
} from './UseReceptionAppointmentActions';
import { useReceptionKanbanData } from './UseReceptionKanbanData';
import { useMinuteClock } from './UseMinuteClock';

// Añade las capacidades temporales de una cita
const mapAppointmentCapabilities = (appointments, currentTime) => (
  appointments.map((appointment) => ({
    ...appointment,
    canMarkNoShow: canMarkAppointmentNoShow(appointment, currentTime)
  }))
);

// Controla el tablero operativo de recepción
export const useReceptionKanban = () => {
  // Mantiene las capacidades actualizadas sin resuscribir consultas
  const currentTime = useMinuteClock();
  const todayKey = formatDateKey(currentTime);
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowKey = formatDateKey(tomorrow);

  // Escucha los datos dentro del rango operativo
  const kanbanData = useReceptionKanbanData({ todayKey, tomorrowKey });

  // Controla acciones remotas por separado
  const actions = useReceptionAppointmentActions();

  // Limita pendientes a las siguientes veinticuatro horas
  const pendingAppointments = useMemo(() => (
    mapAppointmentCapabilities(
      filterOperationalPendingAppointments({
        appointments: kanbanData.pendingAppointments,
        currentTime
      }),
      currentTime
    )
  ), [kanbanData.pendingAppointments, currentTime]);

  // Actualiza la tolerancia de confirmadas cada minuto
  const confirmedAppointments = useMemo(() => (
    mapAppointmentCapabilities(
      kanbanData.confirmedAppointments,
      currentTime
    )
  ), [kanbanData.confirmedAppointments, currentTime]);

  // Lee los contactos reales solo cuando se requiere llamada
  const contactsByClientId = useAppointmentClientContacts(
    pendingAppointments
  );

  // Limpia errores de datos y acciones
  const clearError = () => {
    kanbanData.clearSyncError();
    actions.clearActionError();
  };

  // Devuelve datos acciones y contactos separados
  return {
    pendingAppointments,
    confirmedAppointments,
    inCabinAppointments: kanbanData.inCabinAppointments,
    checkoutAppointments: kanbanData.checkoutAppointments,
    contactsByClientId,
    loading: kanbanData.loading,
    error: actions.actionError || kanbanData.syncError,
    isProcessingAppointment: actions.isProcessingAppointment,
    confirmAppointment: actions.confirmAppointment,
    moveAppointmentToCabin: actions.moveAppointmentToCabin,
    moveAppointmentToCheckout: actions.moveAppointmentToCheckout,
    cancelReceptionAppointment: actions.cancelReceptionAppointment,
    markAppointmentNoShow: actions.markAppointmentNoShow,
    clearError
  };
};
