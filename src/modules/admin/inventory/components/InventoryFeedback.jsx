import { FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';

// Presenta el resultado persistente de una operación
export default function InventoryFeedback({ feedback, onClose }) {
  // Evita reservar espacio sin un resultado
  if (!feedback) {
    return null;
  }

  const warning = feedback.tone === 'warning';
  const Icon = warning ? FiAlertTriangle : FiCheckCircle;
  const tone = warning
    ? 'border-status-pending/40 bg-status-pending/15'
    : 'border-status-confirmed/30 bg-status-confirmed/10';

  // Devuelve un aviso accesible y descartable
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${tone}`}
      role="status"
    >
      <Icon
        aria-hidden="true"
        className={warning ? 'mt-0.5 text-secondary' : 'mt-0.5 text-status-confirmed'}
      />
      <p className="min-w-0 flex-1 text-sm font-medium text-primary">
        {feedback.message}
      </p>
      <button
        aria-label="Cerrar aviso"
        className="rounded-lg p-1 text-muted transition hover:bg-background hover:text-primary"
        onClick={onClose}
        type="button"
      >
        <FiX aria-hidden="true" />
      </button>
    </div>
  );
}
