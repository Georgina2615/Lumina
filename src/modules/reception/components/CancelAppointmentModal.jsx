export default function CancelAppointmentModal({ cita, onClose, onCancel }) {
  if (!cita) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
        <h3 className="font-title font-bold text-xl mb-2 text-primary">{cita.nombreCompleto}</h3>
        <p className="text-muted mb-1 font-semibold">{cita.servicio}</p>
        <p className="text-sm text-muted mb-6">
          Fecha: {cita.fecha} <br/> Hora: {cita.hora}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onCancel} 
            className="w-full py-2 bg-error text-white rounded-lg font-medium hover:opacity-90 transition"
          >
            Cancelar Cita (No Show)
          </button>
          <button 
            onClick={onClose} 
            className="w-full py-2 border border-surface-hover text-muted rounded-lg font-medium hover:bg-surface-hover transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}