import {
  FiAlertTriangle,
  FiClock,
  FiHelpCircle,
  FiMail
} from 'react-icons/fi';
import { maxTicketAttempts } from '../services/SaleTicketPolicy';
import POSTicketActions from './POSTicketActions';
import POSTicketRestartForm from './POSTicketRestartForm';

// Define el formato temporal operativo
const dateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

// Convierte una fecha persistida para la vista
const formatLastAttempt = (lastAttemptAt) => (
  Number.isFinite(lastAttemptAt)
    ? dateTimeFormatter.format(new Date(lastAttemptAt))
    : 'Sin intento registrado'
);

// Presenta una venta que requiere intervención
export default function POSTicketQueueItem({
  ticket,
  onConfirm,
  onRestart,
  onRetry
}) {
  // Detecta un envío ambiguo
  const isUnconfirmed = ticket.ticketStatus === 'no_confirmado';
  // Resuelve el icono operativo
  const StatusIcon = isUnconfirmed
    ? FiHelpCircle
    : FiAlertTriangle;
  // Define el título accesible
  const titleId = `ticket-queue-${ticket.saleId}`;

  // Devuelve el caso pendiente
  return (
    <article
      aria-labelledby={titleId}
      aria-busy={ticket.actionState.processing}
      className="rounded-xl border border-surface-hover bg-surface p-4 shadow-sm transition duration-200 hover:border-secondary/30 motion-reduce:transition-none"
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${isUnconfirmed ? 'bg-status-pending/15 text-secondary' : 'bg-error/10 text-error'}`}>
          <StatusIcon aria-hidden="true" className="text-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p
                id={titleId}
                className="text-sm font-bold text-primary"
              >
                {ticket.folio}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {ticket.clientName}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isUnconfirmed ? 'bg-status-pending/15 text-secondary' : 'bg-error/10 text-error'}`}>
              {isUnconfirmed ? 'Por verificar' : 'Fallido'}
            </span>
          </div>

          <div className="mt-3 grid gap-1.5 text-xs text-muted">
            <p className="flex items-start gap-2">
              <FiMail aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="break-all">
                {ticket.recipientEmail || 'Correo no disponible'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <FiClock aria-hidden="true" className="mt-0.5 shrink-0" />
              <span>{formatLastAttempt(ticket.lastAttemptAt)}</span>
            </p>
          </div>

          <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-secondary">
            Intentos {ticket.attempts} de {maxTicketAttempts}
          </p>

          {isUnconfirmed && (
            <p className="mt-2 rounded-lg bg-status-pending/10 px-3 py-2 text-xs leading-5 text-primary">
              Revisa el historial de correos enviados antes de confirmar o reintentar
            </p>
          )}

          {ticket.lastError && (
            <p className="mt-2 rounded-lg bg-error/5 px-3 py-2 text-xs leading-5 text-error">
              No se pudo completar el envío anterior
            </p>
          )}

          {ticket.actionState.error && (
            <p
              role="alert"
              className="mt-2 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error"
            >
              {ticket.actionState.error}
            </p>
          )}

          <POSTicketActions
            action={ticket.actionState.action}
            processing={ticket.actionState.processing}
            retryAvailability={ticket.retryAvailability}
            ticketStatus={ticket.ticketStatus}
            onConfirm={() => onConfirm(ticket.saleId)}
            onRetry={() => onRetry(ticket.saleId)}
          />
          {ticket.canRestart && (
            <POSTicketRestartForm
              processing={ticket.actionState.processing}
              saleId={ticket.saleId}
              onRestart={(reason) => onRestart(ticket.saleId, reason)}
            />
          )}
        </div>
      </div>
    </article>
  );
}
