import {
  FiLoader,
  FiX
} from 'react-icons/fi';
import { useAccessibleDialog } from '../../../shared/hooks';
import { formatCurrency } from '../services/SaleCalculationService';
import POSPaymentFields from './POSPaymentFields';
import POSPaymentMethodSelector from './POSPaymentMethodSelector';
import POSReceiptEmailField from './POSReceiptEmailField';
import POSSaleSuccess from './POSSaleSuccess';

// Presenta la captura accesible del cobro
export default function POSCheckoutModal({
  isOpen,
  amountDueCents,
  error,
  form,
  paymentPreview,
  processing,
  receipt,
  retryMode = false,
  saleResult,
  showReceiptEmail = false,
  submitDisabled = false,
  onChange,
  onClose,
  onConfirm,
  onFinish,
  onSelectMethod
}) {
  // Permite cerrar solo antes de confirmar
  const canClose = !processing && !saleResult;
  // Conecta el control accesible del diálogo
  const dialogRef = useAccessibleDialog({
    isOpen,
    onRequestClose: onClose,
    canClose,
    focusKey: saleResult ? 'success' : 'payment'
  });

  // Omite contenido cuando está cerrado
  if (!isOpen) {
    // Devuelve ausencia visual
    return null;
  }

  // Devuelve el diálogo de cobro
  return (
    <div
      role="presentation"
      onMouseDown={(event) => {
        // Cierra al tocar el fondo seguro
        if (event.target === event.currentTarget && canClose) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-primary/45 p-4 backdrop-blur-sm"
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-2xl outline-none"
      >
        {saleResult ? (
          <POSSaleSuccess result={saleResult} onFinish={onFinish} />
        ) : (
          <form onSubmit={(event) => {
            event.preventDefault();
            onConfirm();
          }}>
            <div className="flex items-center justify-between border-b border-surface-hover bg-background px-5 py-4">
              <div>
                <h2
                  id="checkout-title"
                  data-dialog-initial-focus
                  tabIndex={-1}
                  className="text-xl text-primary outline-none"
                >
                  {retryMode ? 'Reanudar cobro' : 'Confirmar cobro'}
                </h2>
                {!retryMode && (
                  <p className="mt-0.5 text-xs text-muted">
                    Verifica la distribución antes de registrar
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                aria-label="Cerrar cobro"
                className="rounded-lg p-2 text-muted transition hover:bg-error/10 hover:text-error disabled:opacity-40"
              >
                <FiX aria-hidden="true" className="text-xl" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <div className="mb-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Saldo por cobrar
                </p>
                <p className="mt-1 font-title text-4xl font-bold text-primary">
                  {formatCurrency(amountDueCents)}
                </p>
              </div>

              {retryMode && (
                <p className="mb-4 rounded-xl border border-status-pending/30 bg-status-pending/10 px-3 py-2.5 text-sm font-medium text-primary">
                  Los datos están bloqueados para evitar un cobro duplicado
                </p>
              )}

              <fieldset disabled={retryMode || processing}>
                <POSPaymentMethodSelector
                  value={form.method}
                  onChange={onSelectMethod}
                />

                <div className="mt-5">
                  <POSPaymentFields
                    form={form}
                    preview={paymentPreview}
                    amountDueCents={amountDueCents}
                    onChange={onChange}
                  />
                </div>

                {showReceiptEmail && !retryMode && (
                  <div className="mt-5">
                    <POSReceiptEmailField
                      disabled={processing}
                      error={receipt.receiptEmailError}
                      value={receipt.receiptEmail}
                      onBlur={receipt.validateReceiptEmail}
                      onChange={receipt.updateReceiptEmail}
                    />
                  </div>
                )}
              </fieldset>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-surface-hover bg-background p-4">
              <button
                type="submit"
                disabled={processing || submitDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-muted disabled:shadow-none"
              >
                {processing && (
                  <FiLoader aria-hidden="true" className="animate-spin" />
                )}
                {processing
                  ? 'Registrando cobro'
                  : `${retryMode ? 'Reintentar' : 'Cobrar'} ${formatCurrency(amountDueCents)}`}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
