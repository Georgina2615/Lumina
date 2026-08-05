import { FiArrowLeft, FiCheckCircle, FiPhone, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Presenta la identidad vinculada con la ficha
export default function ClinicalRecordHeader({ client, cosmetologistName, status }) {
  return (
    <header className="space-y-4">
      <Link className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-semibold text-muted transition hover:text-primary" to="/dashboard/clinical">
        <FiArrowLeft aria-hidden="true" />
        Volver a mi agenda
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Cabina</p>
          <h1 className="text-3xl text-primary sm:text-4xl">Ficha técnica facial</h1>
          <p className="mt-1 text-sm text-muted sm:text-base">Evaluación estética y antecedentes declarados</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          status === 'completed'
            ? 'bg-status-confirmed/15 text-status-confirmed'
            : 'bg-status-pending/15 text-secondary'
        }`}>
          {status === 'completed' ? 'Ficha completa' : 'Borrador'}
        </span>
      </div>

      <section className="grid gap-3 rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3">
          <FiUser aria-hidden="true" className="text-secondary" />
          <div><p className="text-xs text-muted">Clienta</p><p className="font-semibold text-primary">{client.name}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <FiPhone aria-hidden="true" className="text-secondary" />
          <div><p className="text-xs text-muted">Teléfono</p><p className="font-semibold text-primary">{client.phone || 'Sin teléfono'}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <FiUser aria-hidden="true" className="text-secondary" />
          <div><p className="text-xs text-muted">Cosmetóloga</p><p className="font-semibold text-primary">{cosmetologistName}</p></div>
        </div>
        <div className="flex items-center gap-3">
          <FiCheckCircle aria-hidden="true" className={client.consentSigned ? 'text-status-confirmed' : 'text-status-pending'} />
          <div><p className="text-xs text-muted">Firma general</p><p className="font-semibold text-primary">{client.consentSigned ? 'Registrada' : 'Pendiente'}</p></div>
        </div>
      </section>
    </header>
  );
}
