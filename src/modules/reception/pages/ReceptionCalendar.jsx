import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es'; 
import 'react-big-calendar/lib/css/react-big-calendar.css'; 
import { useReceptionCalendar } from '../../hooks/useReceptionCalendar';
import ReceptionAppointmentForm from '../../components/reception/ReceptionAppointmentForm';

const locales = { 'es': es };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), getDay, locales });

export default function ReceptionCalendar() {
  const { citasCalendario, cargandoCalendario, cancelarCita } = useReceptionCalendar();
  
  const [mostrarModalNueva, setMostrarModalNueva] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null); 
  
  const [fechaActual, setFechaActual] = useState(new Date());
  const [vistaActual, setVistaActual] = useState('week');

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

  const handleSeleccionarEspacio = (slotInfo) => {
    if (slotInfo.start.getHours() === 13) return; // Bloqueo de clic 
    setMostrarModalNueva(true);
  };

  const handleSeleccionarCita = (cita) => {
    setCitaSeleccionada(cita);
  };

  // Función que conecta el botón de la vista 
  const handleCancelarCita = async () => {
    if (window.confirm('¿Estás segura de cancelar esta cita?')) {
      try {
        await cancelarCita(citaSeleccionada.id); 
        setCitaSeleccionada(null); // Cerramos el modal
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
          min={new Date(2024, 1, 1, 10, 0)} 
          max={new Date(2024, 1, 1, 20, 0)} 
          eventPropGetter={eventStyleGetter}
          slotPropGetter={slotPropGetter} 
          selectable={true}
          onSelectSlot={handleSeleccionarEspacio}
          onSelectEvent={handleSeleccionarCita} 
          messages={{ next: "Siguiente", previous: "Anterior", today: "Hoy", month: "Mes", week: "Semana", day: "Día" }}
          style={{ height: '100%' }}
        />
      </div>

      {/* Modal: Agendar Nueva Cita */}
      {mostrarModalNueva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center p-4 border-b border-surface-hover sticky top-0 bg-background z-10">
              <h2 className="font-title font-bold text-xl text-primary">Agendar Nueva Cita</h2>
              <button onClick={() => setMostrarModalNueva(false)} className="text-muted hover:text-error text-xl font-bold px-2">✕</button>
            </div>
            <div className="p-4">
              <ReceptionAppointmentForm onClose={() => setMostrarModalNueva(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalles y Cancelar Cita Atorada */}
      {citaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
          <div className="bg-background rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
            <h3 className="font-title font-bold text-xl mb-2 text-primary">{citaSeleccionada.nombreCompleto}</h3>
            <p className="text-muted mb-1 font-semibold">{citaSeleccionada.servicio}</p>
            <p className="text-sm text-muted mb-6">
              Fecha: {citaSeleccionada.fecha} <br/> Hora: {citaSeleccionada.hora}
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleCancelarCita} 
                className="w-full py-2 bg-error text-white rounded-lg font-medium hover:opacity-90 transition"
              >
                Cancelar Cita (No Show)
              </button>
              <button 
                onClick={() => setCitaSeleccionada(null)} 
                className="w-full py-2 border border-surface-hover text-muted rounded-lg font-medium hover:bg-surface-hover transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}