import { FiRefreshCw } from 'react-icons/fi';
import AdminInvoiceCollection from '../components/AdminInvoiceCollection';
import AdminInvoiceDetailsModal from '../components/AdminInvoiceDetailsModal';
import AdminInvoiceSummary from '../components/AdminInvoiceSummary';
import { useAdminInvoices } from '../hooks/UseAdminInvoices';
import { ADMIN_INVOICE_STATUS } from '../services/AdminInvoicePolicy';

const filters = [
  { id: ADMIN_INVOICE_STATUS.all, label: 'Todas' },
  { id: ADMIN_INVOICE_STATUS.pending, label: 'Pendientes' },
  { id: ADMIN_INVOICE_STATUS.prepared, label: 'Preparadas' },
  { id: ADMIN_INVOICE_STATUS.delivered, label: 'Atendidas' }
];

// Presenta las solicitudes fiscales de las clientas
export default function AdminInvoices() {
  const invoices = useAdminInvoices();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Administración</p>
          <h1 className="text-3xl text-primary sm:text-4xl">Solicitudes de factura</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">Revisa los datos y registra las facturas preparadas</p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary shadow-sm disabled:opacity-60"
          disabled={invoices.isLoading || invoices.isRefreshing}
          onClick={invoices.refreshRequests}
          type="button"
        >
          <FiRefreshCw aria-hidden="true" className={invoices.isRefreshing ? 'motion-safe:animate-spin' : ''} />
          {invoices.isRefreshing ? 'Actualizando' : 'Actualizar'}
        </button>
      </header>

      {invoices.error && (
        <p className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">{invoices.error}</p>
      )}

      {invoices.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => <div className="h-32 animate-pulse rounded-2xl bg-surface" key={item} />)}
        </div>
      ) : (
        <>
          <AdminInvoiceSummary summary={invoices.summary} />
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-surface-hover bg-surface p-2 shadow-sm" aria-label="Filtrar facturas">
            {filters.map((filter) => (
              <button
                className={`min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${invoices.statusFilter === filter.id ? 'bg-primary text-surface' : 'text-muted hover:bg-background hover:text-primary'}`}
                key={filter.id}
                onClick={() => invoices.setStatusFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <AdminInvoiceCollection onOpen={invoices.openRequest} requests={invoices.filteredRequests} />
        </>
      )}

      {invoices.selectedRequest && (
        <AdminInvoiceDetailsModal
          error={invoices.actionError}
          isSaving={invoices.isSaving}
          key={invoices.selectedRequest.id}
          onClose={invoices.closeRequest}
          onSubmit={invoices.submitAction}
          request={invoices.selectedRequest}
        />
      )}
    </div>
  );
}
