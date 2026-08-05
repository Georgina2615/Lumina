import { FiFileText, FiMail, FiPhone } from 'react-icons/fi';
import { formatClinicalUpdateDate } from '../services/ClinicalDirectoryPolicy';

const statusStyles = {
  completed: 'bg-status-confirmed/15 text-status-confirmed',
  draft: 'bg-status-pending/15 text-secondary',
  missing: 'bg-surface-hover text-muted'
};

const statusLabels = {
  completed: 'Ficha completa',
  draft: 'Ficha en borrador',
  missing: 'Sin ficha técnica'
};

// Presenta una clienta y el estado real de su ficha
export default function ClinicalDirectoryCard({ entry, onOpen }) {
  const { client, status, updatedAt } = entry;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-xl text-primary">{client.name}</h2>
          <p className="mt-1 text-xs text-muted">
            {status === 'missing'
              ? 'Todavía no tiene evaluación guardada'
              : `Último cambio ${formatClinicalUpdateDate(updatedAt)}`}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
          {statusLabels[status]}
        </span>
      </div>

      <dl className="mt-5 grid gap-3 text-sm">
        <div className="flex items-center gap-3">
          <FiPhone aria-hidden="true" className="shrink-0 text-secondary" />
          <div><dt className="sr-only">Teléfono</dt><dd className="text-muted">{client.phone || 'Sin teléfono'}</dd></div>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          <FiMail aria-hidden="true" className="shrink-0 text-secondary" />
          <div className="min-w-0"><dt className="sr-only">Correo</dt><dd className="truncate text-muted">{client.email || 'Sin correo'}</dd></div>
        </div>
      </dl>

      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-surface-hover bg-background px-4 text-sm font-semibold text-primary transition hover:border-secondary/30 hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        onClick={() => onOpen(entry)}
        type="button"
      >
        <FiFileText aria-hidden="true" />
        {status === 'missing' ? 'Ver estado' : 'Consultar ficha'}
      </button>
    </article>
  );
}
