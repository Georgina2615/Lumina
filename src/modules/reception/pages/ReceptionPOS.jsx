import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiCalendar, FiRefreshCw } from 'react-icons/fi';
import {
  usePOS,
  useSaleTicketQueue
} from '../hooks';
import {
  POSCatalog,
  POSCart,
  POSCheckoutModal,
  POSTicketQueue
} from '../components';

// Presenta una operación aislada del punto de venta
function ReceptionPOSContent({ appointmentId }) {
  // Lee la navegación vigente
  const navigate = useNavigate();
  // Conecta el cerebro del punto de venta
  const pos = usePOS(appointmentId);
  // Conecta la recuperación persistente
  const ticketQueue = useSaleTicketQueue();
  // Resume cantidades visibles
  const cartQuantities = new Map(
    pos.cartItems
      .filter((item) => item.type === 'product')
      .map((item) => [item.id, item.quantity])
  );
  // Determina el contexto de cobro
  const hasAppointment = Boolean(appointmentId);
  // Resuelve el nombre visible
  const clientName = pos.appointment?.clientName
    || (hasAppointment ? 'Cita en revisión' : 'Mostrador');

  // Devuelve la composición principal
  return (
    <div className="flex min-h-full flex-col gap-4 lg:h-full lg:min-h-0">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-secondary">
            Recepción
          </p>
          <h1 className="text-3xl text-primary">Punto de venta</h1>
          <p className="mt-1 text-sm text-muted">
            {hasAppointment
              ? 'Cobro de cita y productos adicionales'
              : 'Venta de productos sin cita'}
          </p>
        </div>
        {pos.appointment && (
          <div className="flex items-center gap-2 rounded-xl border border-surface-hover bg-surface px-3 py-2 text-xs text-secondary shadow-sm">
            <FiCalendar aria-hidden="true" />
            <span className="font-semibold">
              {pos.appointment.dateKey} a las {pos.appointment.time}
            </span>
          </div>
        )}
      </header>

      {pos.appointmentIssue && !pos.hasFrozenSaleRequest && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
        >
          <div className="flex items-center gap-2">
            <FiAlertCircle aria-hidden="true" className="shrink-0" />
            <span>{pos.appointmentIssue}</span>
          </div>
          <button
            type="button"
            onClick={pos.retry}
            className="inline-flex items-center gap-2 rounded-lg bg-error/10 px-3 py-2 text-xs font-semibold transition hover:bg-error/15"
          >
            <FiRefreshCw aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      <POSTicketQueue
        error={ticketQueue.error}
        loading={ticketQueue.loading}
        tickets={ticketQueue.tickets}
        onConfirm={ticketQueue.confirmDelivery}
        onRestart={ticketQueue.restart}
        onRetry={ticketQueue.retry}
      />

      <div className="grid gap-5 pb-4 lg:min-h-[620px] lg:flex-1 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
        <POSCatalog
          products={pos.filteredProducts}
          productsLoading={pos.productsLoading}
          productsError={pos.productsError}
          searchQuery={pos.searchQuery}
          cartQuantities={cartQuantities}
          hasAppointment={hasAppointment}
          interactionLocked={pos.hasFrozenSaleRequest}
          recommendation={pos.recommendation}
          recommendationError={pos.recommendationError}
          onAdd={pos.addProduct}
          onRetry={pos.retry}
          onSearchChange={pos.setSearchQuery}
        />
        <POSCart
          items={pos.cartItems}
          totals={pos.totals}
          clientName={clientName}
          cartError={pos.cartError}
          checkoutIssue={pos.checkoutIssue}
          hasFrozenSaleRequest={pos.hasFrozenSaleRequest}
          loading={pos.productsLoading || pos.appointmentLoading}
          onChangeQuantity={pos.changeProductQuantity}
          onOpenCheckout={pos.openCheckout}
          onRemove={pos.removeProduct}
        />
      </div>

      <POSCheckoutModal
        isOpen={pos.checkoutOpen}
        amountDueCents={pos.checkoutAmountDueCents}
        error={pos.checkoutModalError}
        form={pos.payment.paymentForm}
        paymentPreview={pos.payment.paymentPreview}
        processing={pos.processing}
        receipt={pos.receipt}
        retryMode={pos.hasFrozenSaleRequest}
        saleResult={pos.saleResult}
        showReceiptEmail={!hasAppointment}
        submitDisabled={
          !pos.hasFrozenSaleRequest && Boolean(pos.checkoutIssue)
        }
        onChange={pos.payment.updatePaymentField}
        onClose={pos.closeCheckout}
        onConfirm={pos.confirmSale}
        onFinish={() => navigate('/dashboard/reception')}
        onSelectMethod={pos.payment.selectPaymentMethod}
      />
    </div>
  );
}

// Reinicia el flujo cuando cambia la cita solicitada
export default function ReceptionPOS() {
  // Lee los parámetros de navegación
  const [searchParams] = useSearchParams();
  // Obtiene la cita opcional
  const appointmentId = searchParams.get('appointmentId')?.trim() || null;

  // Aísla carrito pago e idempotencia por operación
  return (
    <ReceptionPOSContent
      key={appointmentId || 'walkin'}
      appointmentId={appointmentId}
    />
  );
}
