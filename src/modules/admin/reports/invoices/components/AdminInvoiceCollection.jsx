import { FiFileText } from 'react-icons/fi';
import {
  ADMIN_INVOICE_STATUS_LABELS,
  formatAdminInvoiceCurrency,
  formatAdminInvoiceDate
} from '../services/AdminInvoicePolicy';

const statusClasses = {
  entregada: 'bg-status-confirmed/15 text-status-confirmed',
  pendiente: 'bg-status-pending/15 text-secondary',
  preparada: 'bg-info/10 text-info'
};

// Presenta las solicitudes disponibles
export default function AdminInvoiceCollection({ onOpen, requests }) {
  if (requests.length === 0) {
    return (
      <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-surface-hover bg-surface p-6 text-center shadow-sm">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted">
          <FiFileText aria-hidden="true" size={22} />
        </span>
        <h2 className="mt-4 text-xl text-primary">No hay solicitudes en esta etapa</h2>
        <p className="mt-1 text-sm text-muted">Las nuevas solicitudes aparecerán aquí</p>
      </section>
    );
  }

  return (
    <section className="grid gap-3 lg:grid-cols-2" aria-label="Solicitudes de factura">
      {requests.map((request) => (
        <article
          className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-secondary/35 hover:shadow-md"
          key={request.id}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {request.saleFolio || 'Venta sin folio'}
              </p>
              <h2 className="mt-2 truncate text-xl text-primary">
                {request.fiscalData.taxpayerName}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {formatAdminInvoiceDate(request.requestedAt)}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[request.status]}`}>
              {ADMIN_INVOICE_STATUS_LABELS[request.status]}
            </span>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-surface-hover pt-4">
            <div>
              <p className="text-xs text-muted">Total de la venta</p>
              <p className="mt-1 font-title text-2xl font-semibold text-primary">
                {formatAdminInvoiceCurrency(request.totalAmountCents)}
              </p>
            </div>
            <button
              className="min-h-10 rounded-xl border border-surface-hover px-4 text-sm font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
              onClick={() => onOpen(request)}
              type="button"
            >
              Ver solicitud
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
