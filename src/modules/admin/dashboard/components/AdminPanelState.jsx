import { FiAlertCircle, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';

// Presenta estados consistentes dentro de los paneles
export default function AdminPanelState({
  children,
  empty,
  emptyMessage,
  error,
  hasData,
  loading,
  onRetry
}) {
  if (loading) {
    return (
      <div
        className="space-y-3 py-2"
        role="status"
        aria-label="Cargando información"
      >
        {[0, 1, 2].map((item) => (
          <div
            className="h-14 rounded-xl bg-surface-hover/60 motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div
        className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-error/20 bg-error/5 p-5 text-center"
        role="alert"
      >
        <FiAlertCircle aria-hidden="true" className="text-error" size={24} />
        <p className="text-sm text-error">{error}</p>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-surface transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          onClick={onRetry}
          type="button"
        >
          <FiRefreshCw aria-hidden="true" />
          Reintentar
        </button>
      </div>
    );
  }

  // Conserva datos anteriores durante una actualización fallida
  return (
    <>
      {error && (
        <div
          className="mb-3 flex items-center gap-2 rounded-xl bg-status-pending/15 px-3 py-2 text-xs text-primary"
          role="status"
        >
          <FiAlertCircle aria-hidden="true" />
          <span>{error} Se conservan los últimos datos disponibles</span>
        </div>
      )}

      {empty ? (
        <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-status-confirmed/15 text-status-confirmed">
            <FiCheckCircle aria-hidden="true" size={20} />
          </span>
          <p className="max-w-sm text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : children}
    </>
  );
}
