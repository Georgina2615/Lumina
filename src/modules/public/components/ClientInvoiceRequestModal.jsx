import { FiCheck, FiLoader, FiX } from 'react-icons/fi';
import { useAccessibleDialog } from '../../../shared/hooks';
import { formatClientSaleAmount } from '../services/ClientAccountPolicy';
import ClientInvoiceFormFields from './ClientInvoiceFormFields';

// Presenta la solicitud fiscal de una venta
export default function ClientInvoiceRequestModal({ request }) {
  const dialogRef = useAccessibleDialog({
    canClose: !request.submitting,
    focusKey: request.success ? 'success' : 'form',
    isOpen: Boolean(request.sale),
    onRequestClose: request.close
  });

  if (!request.sale) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center overflow-y-auto bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !request.submitting) {
          request.close();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby="invoice-request-title"
        aria-modal="true"
        className="my-auto flex min-h-dvh w-full max-w-2xl flex-col overflow-hidden bg-background shadow-2xl outline-none sm:min-h-0 sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-3xl sm:border sm:border-surface-hover"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex items-start justify-between gap-4 border-b border-surface-hover px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Mi cuenta</p>
            <h2 className="mt-1 text-2xl" data-dialog-initial-focus id="invoice-request-title" tabIndex={-1}>Solicitar factura</h2>
            <p className="mt-1 text-sm text-muted">Venta {request.sale.folio} por {formatClientSaleAmount(request.sale.totalAmountCents)}</p>
          </div>
          <button aria-label="Cerrar" className="rounded-xl p-2 text-muted transition hover:bg-surface-hover" disabled={request.submitting} onClick={request.close} type="button"><FiX aria-hidden="true" /></button>
        </header>

        {request.success ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-status-confirmed/15 text-status-confirmed"><FiCheck aria-hidden="true" size={26} /></span>
            <h3 className="mt-5 text-2xl">Solicitud recibida</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">La administradora revisará los datos y preparará la factura</p>
            <button className="mt-7 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-surface" onClick={request.close} type="button">Cerrar</button>
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => {
            event.preventDefault();
            request.submit();
          }}>
            <fieldset className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6" disabled={request.submitting}>
              <ClientInvoiceFormFields form={request.form} onChange={request.updateField} />
              {request.error && <p className="mt-5 rounded-2xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">{request.error}</p>}
            </fieldset>
            <footer className="flex justify-end gap-3 border-t border-surface-hover px-5 py-4">
              <button className="rounded-full border border-surface-hover px-5 py-2.5 text-sm font-semibold" disabled={request.submitting} onClick={request.close} type="button">Cancelar</button>
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-surface disabled:opacity-50" disabled={request.submitting} type="submit">
                {request.submitting && <FiLoader aria-hidden="true" className="animate-spin" />}
                {request.submitting ? 'Enviando' : 'Enviar solicitud'}
              </button>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
}
