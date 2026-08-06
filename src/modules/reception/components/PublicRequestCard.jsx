import { FiCalendar, FiMail, FiPhone } from 'react-icons/fi';
import { formatCurrency } from '../services/SaleCalculationService';

// Formatea una fecha de cita legible
const formatSchedule = (request) => {
  if (!request.schedule.start) {
    return `${request.schedule.dateKey ?? ''} ${request.schedule.time ?? ''}`;
  }
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(request.schedule.start);
};

// Presenta el resumen de una solicitud
export default function PublicRequestCard({ request, onReview }) {
  return (
    <article className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">
            Solicitud por internet
          </p>
          <h2 className="mt-1 truncate font-title text-xl font-bold text-primary">
            {request.client.fullName}
          </h2>
        </div>
        <span className="rounded-full bg-status-pending/15 px-3 py-1 text-xs font-semibold text-status-pending">
          Por revisar
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted">
        <p className="flex items-center gap-2">
          <FiCalendar aria-hidden="true" />
          {formatSchedule(request)}
        </p>
        <p className="flex items-center gap-2">
          <FiPhone aria-hidden="true" />
          {request.client.phone}
        </p>
        <p className="flex items-center gap-2 break-all">
          <FiMail aria-hidden="true" />
          {request.client.email}
        </p>
      </div>

      <div className="mt-4 border-t border-surface-hover pt-4">
        <p className="font-semibold text-primary">{request.service.name}</p>
        <div className="mt-1 flex items-center justify-between text-sm text-muted">
          <span>Anticipo recibido</span>
          <strong className="text-primary">
            {formatCurrency(request.service.depositAmountCents)}
          </strong>
        </div>
      </div>

      <button
        className="mt-5 min-h-11 w-full rounded-xl bg-primary px-4 font-semibold text-surface transition hover:bg-primary/90 active:scale-[0.99]"
        onClick={() => onReview(request)}
        type="button"
      >
        Revisar solicitud
      </button>
    </article>
  );
}
