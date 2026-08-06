import {
  FiAlertCircle,
  FiInbox
} from 'react-icons/fi';
import POSTicketQueueItem from './POSTicketQueueItem';

// Presenta la cola persistente de tickets
export default function POSTicketQueue({
  error,
  loading,
  tickets,
  onConfirm,
  onRestart,
  onRetry
}) {
  // Omite una cola vacía sin errores
  if (loading || (!error && tickets.length === 0)) {
    // Devuelve ausencia visual
    return null;
  }

  // Devuelve la superficie operativa
  return (
    <section
      aria-labelledby="ticket-queue-title"
      className="rounded-2xl border border-status-pending/30 bg-background p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-status-pending/15 p-2.5 text-secondary">
            <FiInbox aria-hidden="true" className="text-xl" />
          </div>
          <div>
            <h2
              id="ticket-queue-title"
              className="text-lg text-primary"
            >
              Comprobantes pendientes
            </h2>
          </div>
        </div>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-surface">
          {tickets.length}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-xl bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
        >
          <FiAlertCircle aria-hidden="true" className="shrink-0" />
          {error}
        </p>
      )}

      {tickets.length > 0 && (
        <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
          {tickets.map((ticket) => (
            <POSTicketQueueItem
              key={ticket.saleId}
              ticket={ticket}
              onConfirm={onConfirm}
              onRestart={onRestart}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}
    </section>
  );
}
