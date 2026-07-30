// Obtiene la presentación visual del estado
const getStatusConfig = (status) => {
  // Devuelve la presentación correspondiente
  switch (status) {
    case 'por_confirmar': return { bg: 'bg-status-pending', text: 'text-primary', label: 'Por Confirmar' };
    case 'confirmada': return { bg: 'bg-status-confirmed', text: 'text-primary', label: 'Confirmada' };
    case 'en_cabina': return { bg: 'bg-status-incabin', text: 'text-primary', label: 'En Cabina' };
    case 'por_cobrar': return { bg: 'bg-secondary', text: 'text-surface', label: 'Por Cobrar' };
    case 'finalizada': return { bg: 'bg-status-completed', text: 'text-surface', label: 'Finalizada' };
    default: return { bg: 'bg-surface-hover', text: 'text-primary', label: status };
  }
};

// Formatea la fecha local de la cita
const formatAppointmentDate = (dateKey) => {
  // Conserva un texto seguro cuando falta la fecha
  if (!dateKey) {
    return 'Fecha pendiente';
  }

  // Construye la fecha sin desplazamiento nocturno
  const appointmentDate = new Date(`${dateKey}T12:00:00`);

  // Conserva el valor original cuando la fecha no es válida
  if (Number.isNaN(appointmentDate.getTime())) {
    return dateKey;
  }

  // Devuelve una fecha breve en español
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short'
  }).format(appointmentDate);
};

// Presenta la información operativa de una cita
export default function AppointmentCard({ appointment, children }) {
  // Obtiene la apariencia del estado
  const status = getStatusConfig(appointment.estado);
  // Obtiene la fecha legible
  const formattedDate = formatAppointmentDate(appointment.fecha);

  // Devuelve la tarjeta interactiva
  return (
    <div className="bg-surface rounded-xl shadow-sm border border-surface-hover p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-bold text-lg text-primary">{appointment.hora}</span>
          <time className="text-xs font-medium uppercase tracking-wide text-muted" dateTime={appointment.fecha}>
            {formattedDate}
          </time>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <h3 className="font-title font-semibold text-secondary text-lg">{appointment.nombreCompleto}</h3>
        <p className="text-sm text-muted">Servicio: {appointment.servicio}</p>
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
        {children}
      </div>
    </div>
  );
}
