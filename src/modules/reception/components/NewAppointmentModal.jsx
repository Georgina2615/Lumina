import { ReceptionAppointmentForm } from ".";

export default function NewAppointmentModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center p-4 border-b border-surface-hover sticky top-0 bg-background z-10">
          <h2 className="font-title font-bold text-xl text-primary">Agendar Nueva Cita</h2>
          <button onClick={onClose} className="text-muted hover:text-error text-xl font-bold px-2">✕</button>
        </div>
        <div className="p-4">
          <ReceptionAppointmentForm onClose={onClose} />
        </div>
      </div>
    </div>
  );
}