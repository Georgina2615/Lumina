import { FiCheck, FiClock, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import {
  clinicalAppointmentStatus,
  getClinicalScheduleLabel
} from '../services/ClinicalAgendaPolicy';

const statusPresentation = {
  [clinicalAppointmentStatus.pending]: {
    label: 'Por confirmar',
    tone: 'bg-status-pending/15 text-secondary'
  },
  [clinicalAppointmentStatus.confirmed]: {
    label: 'Confirmada',
    tone: 'bg-status-confirmed/15 text-status-confirmed'
  },
  [clinicalAppointmentStatus.inCabin]: {
    label: 'En cabina',
    tone: 'bg-status-incabin/15 text-status-incabin'
  },
  [clinicalAppointmentStatus.checkout]: {
    label: 'En recepción',
    tone: 'bg-secondary/10 text-secondary'
  },
  [clinicalAppointmentStatus.finalized]: {
    label: 'Finalizada',
    tone: 'bg-surface-hover text-muted'
  }
};

// Presenta una cita clínica de la jornada
export default function ClinicalAppointmentCard({ appointment, featured = false }) {
  const presentation = statusPresentation[appointment.status];

  return (
    <article className={`rounded-2xl border bg-surface p-4 shadow-sm transition sm:p-5 ${
      featured
        ? 'border-status-incabin/40 shadow-md'
        : 'border-surface-hover'
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-secondary">
            <FiClock aria-hidden="true" />
            {getClinicalScheduleLabel(appointment.time)}
          </div>
          <h3 className="text-xl text-primary">{appointment.clientName}</h3>
          <p className="mt-1 text-sm text-muted">{appointment.serviceName}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${presentation.tone}`}>
          {appointment.status === clinicalAppointmentStatus.finalized
            ? <FiCheck aria-hidden="true" />
            : <FiUser aria-hidden="true" />}
          {presentation.label}
        </span>
      </div>
      {featured && appointment.clientId && (
        <Link
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          to={`/dashboard/clinical/expediente/${appointment.clientId}/${appointment.id}`}
        >
          Abrir ficha técnica
        </Link>
      )}
    </article>
  );
}
