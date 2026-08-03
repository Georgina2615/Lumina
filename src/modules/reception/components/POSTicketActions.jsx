import {
  FiCheck,
  FiLoader,
  FiRefreshCw
} from 'react-icons/fi';

// Presenta acciones permitidas para un ticket
export default function POSTicketActions({
  action,
  processing,
  retryAvailability,
  ticketStatus,
  onConfirm,
  onRetry
}) {
  // Detecta un fallo confirmado
  const isFailed = ticketStatus === 'fallido';
  // Detecta una entrega ambigua
  const isUnconfirmed = ticketStatus === 'no_confirmado';
  // Detecta el reintento vigente
  const isRetrying = processing && action === 'retry';
  // Detecta la confirmación vigente
  const isConfirming = processing && action === 'confirmed';
  // Compone el texto del reintento
  const retryLabel = retryAvailability.blockedReason
    || (
      isRetrying
        ? 'Solicitando reintento'
        : isUnconfirmed
          ? 'No aparece y reenviar'
          : 'Reintentar envío'
    );

  // Omite acciones en estados informativos
  if (!isFailed && !isUnconfirmed) {
    // Devuelve ausencia visual
    return null;
  }

  // Devuelve controles coherentes
  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      {isUnconfirmed && (
        <button
          type="button"
          disabled={processing}
          onClick={onConfirm}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-status-confirmed/30 bg-status-confirmed/10 px-3 py-2.5 text-xs font-bold text-primary transition duration-200 hover:-translate-y-0.5 hover:bg-status-confirmed/15 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none"
        >
          {isConfirming ? (
            <FiLoader aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
          ) : (
            <FiCheck aria-hidden="true" />
          )}
          {isConfirming ? 'Confirmando entrega' : 'Sí aparece en el historial'}
        </button>
      )}

      <button
        type="button"
        disabled={processing || !retryAvailability.canRetry}
        onClick={onRetry}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-muted disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none"
      >
        {isRetrying ? (
          <FiLoader aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
        ) : (
          <FiRefreshCw aria-hidden="true" />
        )}
        {retryLabel}
      </button>
    </div>
  );
}
