import { format, getDay, parse, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { dateFnsLocalizer } from 'react-big-calendar';

// Configura la localización del calendario
export const calendarLocalizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { es }
});

// Define los textos visibles del calendario
export const calendarMessages = {
  next: 'Siguiente',
  previous: 'Anterior',
  today: 'Hoy',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  noEventsInRange: 'No hay citas en este periodo'
};

// Relaciona cada estado con su color
const colorByStatus = {
  por_confirmar: 'var(--color-status-pending)',
  confirmada: 'var(--color-status-confirmed)',
  en_cabina: 'var(--color-status-incabin)',
  completada: 'var(--color-status-completed)',
  finalizada: 'var(--color-status-completed)',
  cancelada: 'var(--color-error)'
};

// Define los estados que necesitan texto claro
const lightTextStatuses = new Set(['cancelada', 'completada', 'finalizada']);

// Define la apariencia de cada cita
export const getAppointmentEventStyle = (appointment) => {
  // Detecta el estado histórico cancelado
  const isCancelled = appointment.estado === 'cancelada';

  // Devuelve estilos requeridos por la librería
  return {
    style: {
      backgroundColor: colorByStatus[appointment.estado] ?? 'var(--color-muted)',
      border: isCancelled ? '1px dashed var(--color-error)' : '0',
      borderRadius: '8px',
      color: lightTextStatuses.has(appointment.estado) ? '#ffffff' : '#181313',
      display: 'block',
      opacity: isCancelled ? 0.58 : 0.92,
      textDecoration: isCancelled ? 'line-through' : 'none'
    }
  };
};

// Define la apariencia del horario no disponible
export const getCalendarSlotStyle = (date) => {
  // Detecta el horario de preparación
  if (date.getHours() === 13) {
    // Devuelve estilos requeridos por la librería
    return {
      style: {
        backgroundColor: 'var(--color-surface-hover)',
        cursor: 'not-allowed',
        opacity: 0.55
      }
    };
  }

  // Devuelve una celda disponible
  return {};
};
