import { FiArrowLeft, FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Presenta la identidad y la cita del seguimiento
export default function ClinicalSessionHeader({ appointment, client, status }) {
  return (
    <header className="space-y-4">
      <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-semibold text-muted transition hover:text-primary" to="/dashboard/clinical">
        <FiArrowLeft aria-hidden="true" /> Volver a mi agenda
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Cabina</p>
          <h1 className="text-3xl text-primary sm:text-4xl">Hoja de seguimiento</h1>
          <p className="mt-1 text-sm text-muted sm:text-base">Registro de la sesión y evolución observada</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          status === 'completed'
            ? 'bg-status-confirmed/15 text-status-confirmed'
            : 'bg-status-pending/15 text-secondary'
        }`}>
          {status === 'completed' ? 'Seguimiento completo' : 'Borrador'}
        </span>
      </div>
      <section className="grid gap-3 rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3"><FiUser aria-hidden="true" className="text-secondary" /><div><p className="text-xs text-muted">Clienta</p><p className="font-semibold text-primary">{client.name}</p></div></div>
        <div className="flex items-center gap-3"><FiCalendar aria-hidden="true" className="text-secondary" /><div><p className="text-xs text-muted">Fecha</p><p className="font-semibold text-primary">{appointment.date}</p></div></div>
        <div className="flex items-center gap-3"><FiClock aria-hidden="true" className="text-secondary" /><div><p className="text-xs text-muted">Hora</p><p className="font-semibold text-primary">{appointment.time}</p></div></div>
        <div><p className="text-xs text-muted">Servicio reservado</p><p className="font-semibold text-primary">{appointment.service}</p></div>
      </section>
    </header>
  );
}
