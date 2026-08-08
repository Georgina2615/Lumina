import { FiFileText } from 'react-icons/fi';
import {
  formatClientSaleAmount,
  formatClientSaleDate
} from '../services/ClientAccountPolicy';

const invoiceStates = {
  pendiente: { label: 'Solicitud recibida', tone: 'bg-status-pending/20 text-secondary' },
  en_preparacion: { label: 'Preparando factura', tone: 'bg-status-active/15 text-status-active' },
  enviada: { label: 'Factura enviada', tone: 'bg-status-confirmed/15 text-status-confirmed' },
  rechazada: { label: 'Revisión necesaria', tone: 'bg-error/10 text-error' }
};

// Presenta una venta disponible para facturación
export default function ClientSaleCard({ email, onRequestInvoice, sale }) {
  const invoiceState = invoiceStates[sale.invoiceStatus] ?? null;

  return (
    <article className="rounded-3xl border border-surface-hover bg-surface p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">{sale.saleType === 'mostrador' ? 'Compra' : 'Tratamiento'}</p>
          <h3 className="mt-2 text-xl">{sale.folio || 'Venta registrada'}</h3>
          <p className="mt-1 text-sm text-muted">{formatClientSaleDate(sale.createdAt)}</p>
        </div>
        <p className="font-title text-2xl font-semibold text-primary">{formatClientSaleAmount(sale.totalAmountCents)}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-surface-hover pt-4">
        {invoiceState ? (
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${invoiceState.tone}`}>{invoiceState.label}</span>
        ) : (
          <p className="text-sm text-muted">Factura disponible</p>
        )}
        {!invoiceState && (
          <button className="inline-flex min-h-10 items-center gap-2 rounded-full border border-surface-hover px-4 text-sm font-semibold transition hover:bg-background" onClick={() => onRequestInvoice(sale, email)} type="button"><FiFileText aria-hidden="true" />Solicitar factura</button>
        )}
      </div>
    </article>
  );
}
