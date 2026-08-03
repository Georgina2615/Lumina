import {
  cabinMovementOptions,
  formatCabinCurrency,
  isCabinStockEntry,
  parseCabinCents
} from '../services/CabinInventoryPolicy';
import {
  formatCabinQuantity,
  parseCabinQuantity
} from '../services/CabinQuantityService';

const inputClassName = 'mt-1.5 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition placeholder:text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/15';
const labelClassName = 'text-xs font-semibold text-muted';

// Presenta los datos de un movimiento de existencias
export default function CabinMovementFields({ form, mode, onChange, supply }) {
  const entry = isCabinStockEntry(form.type);
  const quantityScaled = parseCabinQuantity(form.quantity, supply.unit);
  const validQuantity = quantityScaled !== null;
  const projectedStock = validQuantity
    ? supply.stockScaled + (entry ? quantityScaled : -quantityScaled)
    : supply.stockScaled;
  const totalCostCents = parseCabinCents(form.totalCost);
  const requiresCost = form.type === 'entrada_reabastecimiento'
    || (form.type === 'ajuste_positivo' && supply.stockScaled === 0);
  const quantityStep = supply.unit === 'pieza' ? '1' : '0.001';
  const quantityMaximum = supply.unit === 'pieza'
    ? '999999999'
    : '999999.999';
  const availableMovements = mode === 'replenish'
    ? cabinMovementOptions.filter((option) => (
      option.type === 'entrada_reabastecimiento'
    ))
    : cabinMovementOptions.filter((option) => (
      option.type !== 'entrada_reabastecimiento'
    ));

  // Devuelve la captura y una previsión sin guardar cambios
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-surface-hover bg-surface p-4 text-center">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Actual
          </p>
          <p className="mt-1 font-title text-lg font-bold tabular-nums text-primary">
            {formatCabinQuantity(supply.stockScaled, supply.unit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Cambio
          </p>
          <p className={`mt-1 font-title text-lg font-bold tabular-nums ${entry ? 'text-status-confirmed' : 'text-error'}`}>
            {validQuantity
              ? `${entry ? '+' : '−'}${formatCabinQuantity(quantityScaled, supply.unit)}`
              : '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Resultado
          </p>
          <p className={`mt-1 font-title text-lg font-bold tabular-nums ${projectedStock < 0 ? 'text-error' : 'text-primary'}`}>
            {formatCabinQuantity(projectedStock, supply.unit)}
          </p>
        </div>
      </div>

      <label className={`block ${labelClassName}`}>
        Tipo de cambio
        <select
          className={inputClassName}
          onChange={(event) => onChange('type', event.target.value)}
          value={form.type}
        >
          {availableMovements.map((option) => (
            <option key={option.type} value={option.type}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Cantidad en {supply.unit}
          <input
            className={inputClassName}
            inputMode="decimal"
            max={quantityMaximum}
            min={quantityStep}
            onChange={(event) => onChange('quantity', event.target.value)}
            placeholder="0"
            required
            step={quantityStep}
            type="number"
            value={form.quantity}
          />
        </label>
        {entry && (
          <label className={labelClassName}>
            Costo total {!requiresCost && 'opcional'}
            <input
              className={inputClassName}
              inputMode="decimal"
              max="10000000"
              min="0.01"
              onChange={(event) => onChange('totalCost', event.target.value)}
              placeholder="0.00"
              required={requiresCost}
              step="0.01"
              type="number"
              value={form.totalCost}
            />
          </label>
        )}
      </div>

      {entry && (
        <div className="rounded-xl border border-status-confirmed/25 bg-status-confirmed/10 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted">
            {totalCostCents
              ? `${formatCabinCurrency(totalCostCents)} quedará guardado como costo de compra`
              : requiresCost
                ? 'Escribe el costo porque todavía no hay compras anteriores'
              : form.type === 'ajuste_positivo'
                ? 'Si no escribes un costo se conservará el promedio actual'
                : 'El costo permite calcular cuánto vale el inventario'}
          </p>
        </div>
      )}

      <label className={`block ${labelClassName}`}>
        Motivo del cambio
        <textarea
          className={`${inputClassName} min-h-24 resize-y py-3`}
          maxLength={240}
          onChange={(event) => onChange('reason', event.target.value)}
          placeholder="Explica por qué cambió la cantidad"
          required
          value={form.reason}
        />
      </label>

      <label className={`block ${labelClassName}`}>
        Factura o nota opcional
        <input
          className={inputClassName}
          maxLength={120}
          onChange={(event) => onChange('reference', event.target.value)}
          placeholder="Número de factura o una nota"
          value={form.reference}
        />
      </label>
    </div>
  );
}
