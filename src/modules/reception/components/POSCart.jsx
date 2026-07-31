import { FiLock, FiShoppingBag } from 'react-icons/fi';
import POSCartItem from './POSCartItem';
import POSTotals from './POSTotals';

// Presenta la orden actual y abre el cobro
export default function POSCart({
  items,
  totals,
  clientName,
  cartError,
  checkoutIssue,
  hasFrozenSaleRequest,
  loading,
  onChangeQuantity,
  onOpenCheckout,
  onRemove
}) {
  // Cuenta unidades visibles
  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );
  // Bloquea cobros incompletos
  const disabled = !hasFrozenSaleRequest
    && (loading || Boolean(checkoutIssue));
  // Oculta cambios posteriores al primer envío
  const visibleCheckoutIssue = hasFrozenSaleRequest || items.length === 0
    ? null
    : checkoutIssue;

  // Devuelve la orden completa
  return (
    <section
      aria-labelledby="current-sale-title"
      className="flex flex-col overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm lg:h-full lg:min-h-0"
    >
      <div className="flex items-center justify-between gap-4 bg-primary p-5 text-surface">
        <div className="min-w-0">
          <h2 id="current-sale-title" className="flex items-center gap-2 text-lg">
            <FiShoppingBag aria-hidden="true" />
            Venta actual
          </h2>
          <p className="mt-1 truncate text-xs uppercase tracking-wider text-surface/75">
            Cliente <span className="font-bold">{clientName}</span>
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-surface px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
          {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
        </span>
      </div>

      <div className="p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full min-h-56 flex-col items-center justify-center px-5 text-center text-muted">
            <FiShoppingBag aria-hidden="true" className="text-4xl opacity-30" />
            <h3 className="mt-3 text-base text-primary">La venta está vacía</h3>
            <p className="mt-1 text-xs">Selecciona productos reales del catálogo</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <POSCartItem
                key={`${item.type}-${item.id}`}
                item={item}
                interactionLocked={hasFrozenSaleRequest}
                onChangeQuantity={onChangeQuantity}
                onRemove={onRemove}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-surface-hover bg-background p-5">
        <POSTotals totals={totals} />
        {(cartError || visibleCheckoutIssue) && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error"
          >
            {cartError || visibleCheckoutIssue}
          </p>
        )}
      </div>

      <div className="border-t border-surface-hover bg-background p-4">
        <button
          type="button"
          onClick={onOpenCheckout}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-muted disabled:shadow-none"
        >
          <FiLock aria-hidden="true" />
          {hasFrozenSaleRequest ? 'Reanudar cobro' : 'Continuar al cobro'}
        </button>
      </div>
    </section>
  );
}
