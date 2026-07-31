import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek
} from 'date-fns';
import { canCancelAppointment } from '../services/AppointmentService';
import {
  formatDateKey,
  subscribeCalendarAppointments
} from '../services/AppointmentQueryService';
import {
  useReceptionAppointmentActions
} from './UseReceptionAppointmentActions';

// Define el rango real de la vista
const getCalendarRange = (visibleDate, view) => {
  // Devuelve el rango mensual
  if (view === 'month') {
    // Calcula los límites visibles del mes
    const start = startOfWeek(startOfMonth(visibleDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleDate), { weekStartsOn: 1 });

    // Devuelve los límites mensuales
    return { start, end };
  }

  // Devuelve el rango diario
  if (view === 'day') {
    return { start: visibleDate, end: visibleDate };
  }

  // Devuelve el rango de agenda
  if (view === 'agenda') {
    return { start: visibleDate, end: addDays(visibleDate, 30) };
  }

  // Calcula los límites semanales
  const start = startOfWeek(visibleDate, { weekStartsOn: 1 });
  const end = endOfWeek(visibleDate, { weekStartsOn: 1 });

  // Devuelve los límites semanales
  return { start, end };
};

// Convierte una cita para el calendario
const mapCalendarAppointment = (appointment) => {
  // Construye el inicio local
  const start = new Date(`${appointment.fecha}T${appointment.hora}:00`);

  // Descarta fechas inválidas
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  // Conserva la duración registrada o aplica el bloque operativo
  const storedDuration = Number(appointment.duracionMinutos);
  const durationMinutes = Number.isFinite(storedDuration) && storedDuration > 0
    ? storedDuration
    : 180;
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  // Devuelve el evento visual
  return {
    ...appointment,
    title: `${appointment.nombreCompleto} - ${appointment.servicio}`,
    start,
    end,
    canCancel: canCancelAppointment(appointment)
  };
};

// Controla la agenda visible
export const useReceptionCalendar = ({ visibleDate, view }) => {
  const [appointments, setAppointments] = useState([]);
  const [loadedRangeKey, setLoadedRangeKey] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Controla cancelaciones mediante el servidor
  const {
    actionError,
    isProcessing,
    cancelReceptionAppointment,
    clearActionError
  } = useReceptionAppointmentActions();

  // Calcula el rango de consulta
  const range = useMemo(
    () => getCalendarRange(visibleDate, view),
    [visibleDate, view]
  );
  const startDateKey = formatDateKey(range.start);
  const endDateKey = formatDateKey(range.end);
  const rangeKey = `${startDateKey}:${endDateKey}`;

  useEffect(() => {
    // Escucha solo el rango visible
    const unsubscribe = subscribeCalendarAppointments({
      startDateKey,
      endDateKey,
      onData: (appointmentData) => {
        // Convierte y depura los eventos
        const calendarAppointments = appointmentData
          .map(mapCalendarAppointment)
          .filter(Boolean);

        setAppointments(calendarAppointments);
        setSyncError(null);
        setLoadedRangeKey(rangeKey);
      },
      onError: (subscriptionError) => {
        console.error('Error al sincronizar la agenda:', subscriptionError);
        setAppointments([]);
        setSyncError('No pudimos sincronizar las citas de este periodo');
        setLoadedRangeKey(rangeKey);
      }
    });

    // Detiene la suscripción vigente
    return () => unsubscribe();
  }, [startDateKey, endDateKey, rangeKey]);

  // Cancela una cita desde la agenda
  const cancelCalendarAppointment = (appointmentId, cancellation) => (
    cancelReceptionAppointment(appointmentId, cancellation)
  );

  // Limpia el mensaje de error
  const clearError = () => {
    setSyncError(null);
    clearActionError();
  };

  // Calcula la carga del rango vigente
  const loading = loadedRangeKey !== rangeKey;

  // Devuelve el estado de la agenda
  return {
    appointments,
    loading,
    error: actionError || syncError,
    cancelling: isProcessing,
    cancelCalendarAppointment,
    clearError
  };
};
