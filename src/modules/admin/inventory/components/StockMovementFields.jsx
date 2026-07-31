import {
  formatInventoryCurrency,
  isStockEntry,
  parseInventoryCents,
  stockMovementOptions
} from '../services/RetailInventoryPolicy';

const inputClassName = 'mt-1.5 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15';
const labelClassName = 'text-xs font-semibold text-muted';

// Presenta los datos de un movimiento de existencias
export default function StockMovementFields({ form, onChange, product }) {
  const entry = isStockEntry(form.type);
  const quantity = Number(form.quantity);
  const validQuantity = Number.isSafeInteger(quantity) && quantity > 0;
  const projectedStock = validQuantity
    ? product.stock + (entry ? quantity : -quantity)
    : product.stock;
  const costCents = parseInventoryCents(form.unitCost);

  // Devuelve la captura y una previsión sin guardar cambios
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-surface-hover bg-surface p-4 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Actual
          </p>
          <p className="mt-1 font-title text-xl font-bold tabular-nums text-primary">
            {product.stock}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Movimiento
          </p>
          <p className={`mt-1 font-title text-xl font-bold tabular-nums ${entry ? 'text-status-confirmed' : 'text-error'}`}>
            {validQuantity ? `${entry ? '+' : '−'}${quantity}` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Resultado
          </p>
          <p className={`mt-1 font-title text-xl font-bold tabular-nums ${projectedStock < 0 ? 'text-error' : 'text-primary'}`}>
            {projectedStock}
          </p>
        </div>
      </div>

      <label className={`block ${labelClassName}`}>
        Tipo de movimiento
        <select
          className={inputClassName}
          onChange={(event) => onChange('type', event.target.value)}
          value={form.type}
        >
          {stockMovementOptions.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Cantidad de unidades
          <input
            className={inputClassName}
            inputMode="numeric"
            max="99999"
            min="1"
            onChange={(event) => onChange('quantity', event.target.value)}
            placeholder="0"
            required
            step="1"
            type="number"
            value={form.quantity}
          />
        </label>
        {entry && (
          <label className={labelClassName}>
            Costo unitario {form.type === 'ajuste_positivo' && 'opcional'}
            <input
              className={inputClassName}
              inputMode="decimal"
              min="0.01"
              onChange={(event) => onChange('unitCost', event.target.value)}
              placeholder="0.00"
              required={form.type === 'entrada_reabastecimiento'}
              step="0.01"
              type="number"
              value={form.unitCost}
            />
          </label>
        )}
      </div>

      {entry && (
        <div className="rounded-xl border border-status-confirmed/25 bg-status-confirmed/10 px-4 py-3">
          <p className="text-xs font-semibold text-primary">
            Información privada de administración
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {costCents
              ? `${formatInventoryCurrency(costCents)} por unidad se integrará al costo promedio`
              : 'El costo se usa para reportes y nunca se muestra en Punto de Venta'}
          </p>
        </div>
      )}

      <label className={`block ${labelClassName}`}>
        Motivo del movimiento
        <textarea
          className={`${inputClassName} min-h-24 resize-y py-3`}
          maxLength={240}
          onChange={(event) => onChange('reason', event.target.value)}
          placeholder="Describe por qué se modifica el inventario"
          required
          value={form.reason}
        />
      </label>

      <label className={`block ${labelClassName}`}>
        Referencia opcional
        <input
          className={inputClassName}
          maxLength={120}
          onChange={(event) => onChange('reference', event.target.value)}
          placeholder="Factura proveedor o nota interna"
          value={form.reference}
        />
      </label>
    </div>
  );
}
