import { useCallback, useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { CancelAppointmentModal, NewAppointmentModal } from '../components';
import {
  calendarLocalizer,
  calendarMessages,
  getAppointmentEventStyle,
  getCalendarSlotStyle
} from '../components/ReceptionCalendarConfig';
import { useReceptionCalendar } from '../hooks';

// Define los únicos inicios operativos
const appointmentHours = new Set(['10:00', '14:00', '17:00']);

// Controla la agenda de recepción
export default function ReceptionCalendar() {
  // Conserva la navegación y los filtros
  const [visibleDate, setVisibleDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('week');
  const [showCancelled, setShowCancelled] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [newAppointmentSlot, setNewAppointmentSlot] = useState(null);
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
    const selectedHour = format(slotInfo.start, 'HH:mm');
    setNewAppointmentSlot({
      dateKey: format(slotInfo.start, 'yyyy-MM-dd'),
      hour: appointmentHours.has(selectedHour) ? selectedHour : ''
    });
    setShowNewAppointment(true);
  };

  // Abre una cita sin selección previa
  const openNewAppointment = () => {
    setNewAppointmentSlot(null);
    setShowNewAppointment(true);
  };

  // Cierra y limpia la selección previa
  const closeNewAppointment = useCallback(() => {
    setShowNewAppointment(false);
    setNewAppointmentSlot(null);
  }, []);

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
            onClick={openNewAppointment} type="button">Nueva cita</button>
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
          eventPropGetter={getAppointmentEventStyle} events={visibleAppointments}
          localizer={calendarLocalizer} max={calendarEnd} messages={calendarMessages}
          min={calendarStart} onNavigate={setVisibleDate}
          onSelectEvent={handleSelectAppointment} onSelectSlot={handleSelectSlot}
          onView={setCurrentView} popup selectable slotPropGetter={getCalendarSlotStyle}
          startAccessor="start" style={{ height: '100%' }} view={currentView} />
      </div>

      <NewAppointmentModal initialSlot={newAppointmentSlot}
        isOpen={showNewAppointment} onClose={closeNewAppointment} />
      <CancelAppointmentModal appointment={selectedAppointment}
        canCancel={Boolean(selectedAppointment?.canCancel)} error={error}
        isSubmitting={cancelling} key={selectedAppointment?.id ?? 'closed'}
        onClose={closeAppointment} onConfirm={confirmCancellation} />
    </div>
  );
}
