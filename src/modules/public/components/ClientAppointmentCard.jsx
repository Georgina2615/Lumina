import { FiCalendar, FiClock, FiMessageCircle } from 'react-icons/fi';
import {
  clientAppointmentStates,
  formatClientAppointmentDate,
  formatClientDeposit
} from '../services/ClientAccountPolicy';

const toneClasses = {
  active: 'bg-status-active/15 text-status-active',
  confirmed: 'bg-status-confirmed/15 text-status-confirmed',
  error: 'bg-error/10 text-error',
  neutral: 'bg-surface-hover text-muted',
  pending: 'bg-status-pending/20 text-secondary'
};

// Presenta una cita sin mostrar información privada
export default function ClientAppointmentCard({ appointment }) {
  const state = clientAppointmentStates[appointment.status]
    ?? clientAppointmentStates.por_confirmar;
  const whatsappMessage = encodeURIComponent(
    `Hola Lumina Skin necesito ayuda con mi cita ${appointment.id}`
  );
  const whatsappUrl = `https://wa.me/529811017687?text=${whatsappMessage}`;

  return (
    <article className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Cita</p>
          <h3 className="mt-2 text-xl">{appointment.serviceName || 'Tratamiento facial'}</h3>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${toneClasses[state.tone]}`}>
          {state.label}
        </span>
      </div>
      <div className="mt-5 grid gap-3 text-sm text-muted sm:grid-cols-2">
        <p className="flex items-center gap-2"><FiCalendar aria-hidden="true" />{formatClientAppointmentDate(appointment)}</p>
        <p className="flex items-center gap-2"><FiClock aria-hidden="true" />{appointment.time} horas</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-surface-hover pt-4">
        <p className="text-sm text-muted">
          Anticipo <strong className="text-primary">{formatClientDeposit(appointment.depositAmountCents)}</strong>
        </p>
        <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-surface-hover px-4 text-sm font-semibold text-primary transition hover:bg-background" href={whatsappUrl} rel="noreferrer" target="_blank">
          <FiMessageCircle aria-hidden="true" />Solicitar ayuda
        </a>
      </div>
      {appointment.status === 'cancelada' && appointment.cancellationReason && (
        <p className="mt-4 rounded-2xl bg-error/5 px-4 py-3 text-sm text-muted">
          Motivo registrado {appointment.cancellationReason}
        </p>
      )}
    </article>
  );
}
