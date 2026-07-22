export default function AppointmentCard({ cita, children }) {

  const getStatusConfig = (estado) => {
    switch (estado) {
      case 'por_confirmar': return { bg: 'bg-status-pending', text: 'text-surface', label: 'Por Confirmar' };
      case 'confirmada': return { bg: 'bg-status-confirmed', text: 'text-surface', label: 'Confirmada' };
      case 'en_cabina': return { bg: 'bg-status-incabin', text: 'text-surface', label: 'En Cabina' };
      case 'finalizada': return { bg: 'bg-status-completed', text: 'text-surface', label: 'Finalizada' };
      default: return { bg: 'bg-surface-hover', text: 'text-primary', label: estado };
    }
  };

  const status = getStatusConfig(cita.estado);

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-surface-hover p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md">
      
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-bold text-lg text-primary">{cita.hora}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
        <h3 className="font-title font-semibold text-secondary text-lg">{cita.nombreCompleto}</h3>
        <p className="text-sm text-muted">Servicio: {cita.servicio}</p>
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
        {children}
      </div>
      
    </div>
  );
}