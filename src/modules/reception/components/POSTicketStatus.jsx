import {
  FiAlertTriangle,
  FiCheck,
  FiMail,
  FiHelpCircle,
  FiSend,
  FiSlash
} from 'react-icons/fi';
import { maxTicketAttempts } from '../services/SaleTicketPolicy';
import POSTicketActions from './POSTicketActions';

// Define la presentación de cada estado
const statusContent = {
  pendiente: {
    icon: FiMail,
    title: 'Ticket en preparación',
    description: 'El envío comenzará en unos segundos',
    tone: 'border-status-pending/30 bg-status-pending/10 text-secondary'
  },
  enviando: {
    icon: FiSend,
    title: 'Enviando ticket',
    description: 'Estamos entregando el comprobante digital',
    tone: 'border-status-incabin/30 bg-status-incabin/10 text-status-incabin'
  },
  enviado: {
    icon: FiCheck,
    title: 'Ticket enviado',
    description: 'El servicio de correo aceptó el envío',
    tone: 'border-status-confirmed/30 bg-status-confirmed/10 text-status-confirmed'
  },
  fallido: {
    icon: FiAlertTriangle,
    title: 'El ticket no pudo enviarse',
    description: 'La venta está segura y puedes reintentar el envío',
    tone: 'border-error/25 bg-error/5 text-error'
  },
  omitido: {
    icon: FiSlash,
    title: 'Ticket digital omitido',
    description: 'La venta se registró sin correo de entrega',
    tone: 'border-surface-hover bg-background text-muted'
  },
  no_confirmado: {
    icon: FiHelpCircle,
    title: 'Envío por verificar',
    description: 'Revisa el historial de EmailJS antes de reenviar',
    tone: 'border-status-pending/30 bg-status-pending/10 text-secondary'
  }
};

// Presenta el estado visual del ticket
export default function POSTicketStatus({
  action,
  actionError,
  attempts,
  ticketStatus,
  recipientEmail,
  lastError,
  observationError,
  processingAction,
  retryAvailability,
  onConfirm,
  onRetry
}) {
  // Resuelve un estado visual seguro
  const content = statusContent[ticketStatus] || statusContent.pendiente;
  // Resuelve el icono vigente
  const StatusIcon = content.icon;
  // Detecta un estado con intervención
  const isActionable = ['fallido', 'no_confirmado'].includes(
    ticketStatus
  );
  // Prioriza errores vigentes de la acción
  const visibleError = observationError
    || (isActionable ? actionError || lastError : '');

  // Devuelve la tarjeta de seguimiento
  return (
    <div
      role={ticketStatus === 'fallido' ? 'alert' : 'status'}
      aria-live={ticketStatus === 'fallido' ? 'assertive' : 'polite'}
      aria-busy={processingAction}
      className={`mt-5 rounded-xl border p-4 text-left transition-all duration-300 motion-reduce:transition-none ${content.tone}`}
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-surface/70 p-2 shadow-sm">
          <StatusIcon
            aria-hidden="true"
            className={`text-lg ${ticketStatus === 'enviando' ? 'animate-pulse motion-reduce:animate-none' : ''}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-primary">{content.title}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            {content.description}
          </p>
          {recipientEmail && (
            <p className="mt-1 break-all text-xs font-semibold text-primary">
              {recipientEmail}
            </p>
          )}
          {isActionable && (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Intentos {attempts} de {maxTicketAttempts}
            </p>
          )}
        </div>
      </div>

      {ticketStatus === 'no_confirmado' && (
        <p className="mt-3 rounded-lg bg-surface/70 px-3 py-2 text-xs leading-5 text-primary">
          Revisa el historial de EmailJS antes de confirmar o reintentar
        </p>
      )}

      {visibleError && (
        <p className="mt-3 rounded-lg bg-surface/70 px-3 py-2 text-xs leading-5 text-error">
          {visibleError}
        </p>
      )}

      <POSTicketActions
        action={action}
        processing={processingAction}
        retryAvailability={retryAvailability}
        ticketStatus={ticketStatus}
        onConfirm={onConfirm}
        onRetry={onRetry}
      />
    </div>
  );
}
