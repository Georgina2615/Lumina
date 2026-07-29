import { useState } from 'react';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CancelAppointmentModal, NewAppointmentModal } from '../components';
import { useReceptionCalendar } from '../hooks';

// Configura las fechas en español
const localizer = dateFnsLocalizer({
  format, parse, startOfWeek, getDay, locales: { es }
});

// Define los textos del calendario
const calendarMessages = {
  next: 'Siguiente', previous: 'Anterior', today: 'Hoy', month: 'Mes',
  week: 'Semana', day: 'Día', agenda: 'Agenda',
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

// Define la apariencia de cada estado
const eventStyleGetter = (appointment) => {
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

// Bloquea visualmente el horario de comida
const slotPropGetter = (date) => {
  // Detecta el horario no disponible
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

// Controla la agenda de recepción
export default function ReceptionCalendar() {
  // Conserva la navegación y los filtros
  const [visibleDate, setVisibleDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [showCancelled, setShowCancelled] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  // Obtiene las citas del rango visible
  const {
    appointments, loading, error, cancelling,
    cancelCalendarAppointment, clearError
  } = useReceptionCalendar({ visibleDate, view: currentView });

  // Prepara las citas visibles y su selección
  const cancelledCount = appointments.filter(
    (appointment) => appointment.estado === 'cancelada'
  ).length;
  const visibleAppointments = showCancelled
    ? appointments
    : appointments.filter((appointment) => appointment.estado !== 'cancelada');
  const selectedAppointment = appointments.find(
    (appointment) => appointment.id === selectedAppointmentId
  ) ?? null;

  // Define los límites horarios visibles
  const calendarStart = new Date(
    visibleDate.getFullYear(), visibleDate.getMonth(), visibleDate.getDate(), 10
  );
  const calendarEnd = new Date(
    visibleDate.getFullYear(), visibleDate.getMonth(), visibleDate.getDate(), 20
  );

  // Abre una nueva cita desde un horario disponible
  const handleSelectSlot = (slotInfo) => {
    // Impide crear citas durante el horario bloqueado
    if (slotInfo.start.getHours() === 13) {
      return;
    }
    setShowNewAppointment(true);
  };

  // Abre el detalle de una cita
  const handleSelectAppointment = (appointment) => {
    clearError();
    setSelectedAppointmentId(appointment.id);
  };

  // Cierra el detalle de la cita
  const closeAppointment = () => {
    clearError();
    setSelectedAppointmentId(null);
  };

  // Confirma una cancelación desde la agenda
  const confirmCancellation = async (reason) => {
    // Detiene acciones sin una cita vigente
    if (!selectedAppointment) {
      return;
    }
    await cancelCalendarAppointment(selectedAppointment.id, reason);
    setSelectedAppointmentId(null);
  };

  // Presenta la primera carga de la agenda
  if (loading && appointments.length === 0) {
    // Devuelve una espera visual discreta
    return <div className="flex h-full items-center justify-center text-muted">Cargando calendario</div>;
  }

  // Devuelve la agenda conectada al rango visible
  return (
    <div className="relative flex h-full flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Recepción</p>
          <h1 className="font-title text-3xl font-bold text-primary">Calendario de Citas</h1>
          <p className="mt-1 text-muted">Control visual de disponibilidad</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button aria-pressed={showCancelled}
            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              showCancelled
                ? 'border-error/30 bg-error/10 text-error'
                : 'border-surface-hover bg-surface text-muted hover:border-primary/30 hover:text-primary'
            }`}
            onClick={() => setShowCancelled((current) => !current)} type="button">
            {showCancelled ? 'Ocultar canceladas' : 'Mostrar canceladas'}
            <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">{cancelledCount}</span>
          </button>
          <button className="rounded-xl bg-primary px-6 py-3 font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            onClick={() => setShowNewAppointment(true)} type="button">Nueva cita</button>
        </div>
      </div>

      {error && !selectedAppointment && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
          <span>{error}</span>
          <button className="rounded-lg px-3 py-1 font-semibold transition hover:bg-error/10"
            onClick={clearError} type="button">Cerrar</button>
        </div>
      )}

      <div aria-busy={loading}
        className="relative min-h-[640px] flex-1 overflow-hidden rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
        {loading && (
          <div className="absolute right-6 top-6 z-10 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-surface shadow">
            Actualizando
          </div>
        )}
        <Calendar culture="es" date={visibleDate} endAccessor="end"
          eventPropGetter={eventStyleGetter} events={visibleAppointments}
          localizer={localizer} max={calendarEnd} messages={calendarMessages}
          min={calendarStart} onNavigate={setVisibleDate}
          onSelectEvent={handleSelectAppointment} onSelectSlot={handleSelectSlot}
          onView={setCurrentView} popup selectable slotPropGetter={slotPropGetter}
          startAccessor="start" style={{ height: '100%' }} view={currentView} />
      </div>

      <NewAppointmentModal isOpen={showNewAppointment}
        onClose={() => setShowNewAppointment(false)} />
      <CancelAppointmentModal appointment={selectedAppointment}
        canCancel={Boolean(selectedAppointment?.canCancel)} error={error}
        isSubmitting={cancelling} key={selectedAppointment?.id ?? 'closed'}
        onClose={closeAppointment} onConfirm={confirmCancellation} />
    </div>
  );
}
