import { FiArrowRight, FiInbox } from 'react-icons/fi';

// Presenta el acceso rápido a solicitudes
export default function PublicRequestNotice({ count, onOpen }) {
  return (
    <button className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-status-pending/25 bg-status-pending/10 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm" onClick={onOpen} type="button">
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-status-pending shadow-sm">
          <FiInbox aria-hidden="true" size={20} />
        </span>
        <span className="min-w-0">
          <span className="block font-title text-lg font-bold text-primary">
            Solicitudes por internet
          </span>
          <span className="block text-sm text-muted">
            {count === 1 ? 'Una solicitud espera revisión' : `${count} solicitudes esperan revisión`}
          </span>
        </span>
      </span>
      <FiArrowRight aria-hidden="true" className="shrink-0 text-secondary transition-transform group-hover:translate-x-1" />
    </button>
  );
}
