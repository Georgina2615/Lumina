import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es'; 
import 'react-big-calendar/lib/css/react-big-calendar.css'; 
import { useReceptionCalendar } from '../hooks';

// ¡NUEVO!: Importamos los modales modulares en lugar del formulario directo
import { NewAppointmentModal, CancelAppointmentModal } from '../components';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const eventStyleGetter = (cita) => {
  let backgroundColor = 'var(--color-surface-hover)'; 
  if (cita.estado === 'por_confirmar') backgroundColor = 'var(--color-status-pending)';
  if (cita.estado === 'confirmada') backgroundColor = 'var(--color-status-confirmed)';
  if (cita.estado === 'en_cabina') backgroundColor = 'var(--color-status-incabin)';
  
  if (!['por_confirmar', 'confirmada', 'en_cabina'].includes(cita.estado)) {
    backgroundColor = '#4b5563'; 
  }
  return { style: { backgroundColor, borderRadius: '8px', opacity: 0.9, color: '#ffffff', border: '0px', display: 'block' } };
};

const slotPropGetter = (date) => {
  if (date.getHours() === 13) {
    return { style: { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } };
  }
  return {};
};

export default function ReceptionCalendar() {
  const { citasCalendario, cargandoCalendario, cancelarCita } = useReceptionCalendar();
  
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null); 
  
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState('week');

  const handleSeleccionarEspacio = (slotInfo) => {
    if (slotInfo.start.getHours() === 13) return; // Bloqueo de clic 
    setMostrarModalNueva(true);
  };

  const handleSeleccionarCita = (cita) => {
    setCitaSeleccionada(cita);
  };

  const handleCancelarCita = async () => {
    if (window.confirm('¿Estás segura de cancelar esta cita?')) {
      try {
        await cancelarCita(citaSeleccionada.id); 
        setCitaSeleccionada(null); 
      } catch (error) {
        alert("Hubo un problema al cancelar la cita.");
      }
    }
  };

  if (cargandoCalendario) return <div className="h-full flex items-center justify-center text-muted">Cargando calendario...</div>;

  return (
    <div className="flex flex-col h-full gap-6 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-title font-bold text-primary">Calendario de Citas</h1>
          <p className="text-muted font-body mt-1">Control visual de disponibilidad</p>
        </div>
        <button onClick={() => setMostrarModalNueva(true)} className="bg-primary text-surface px-6 py-3 rounded-xl font-medium shadow-sm hover:opacity-90">
          + Nueva Cita
        </button>
      </div>

      <div className="flex-1 bg-surface rounded-2xl p-4 border border-surface-hover shadow-sm min-h-[600px]">
        <Calendar
          localizer={localizer}
          events={citasCalendario}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          date={fechaActual}
          onNavigate={(nuevaFecha) => setFechaActual(nuevaFecha)}
          view={vistaActual}
          onView={(nuevaVista) => setVistaActual(nuevaVista)}
          min={new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate(), 10, 0)} 
          max={new Date(fechaActual.getFullYear(), fechaActual.getMonth(), fechaActual.getDate(), 20, 0)}
          eventPropGetter={eventStyleGetter}
          slotPropGetter={slotPropGetter} 
          selectable={true}
          onSelectSlot={handleSeleccionarEspacio}
          onSelectEvent={handleSeleccionarCita} 
          messages={{ next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
          style={{ height: '100%' }}
        />
      </div>

      <NewAppointmentModal 
        isOpen={mostrarModalNueva} 
        onClose={() => setMostrarModalNueva(false)} 
      />

      <CancelAppointmentModal 
        cita={citaSeleccionada}
        onClose={() => setCitaSeleccionada(null)}
        onCancel={handleCancelarCita}
      />
    </div>
  );
}