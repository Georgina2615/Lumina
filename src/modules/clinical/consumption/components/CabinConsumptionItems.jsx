import { FiTrash2 } from 'react-icons/fi';

// Presenta las cantidades utilizadas por insumo
export default function CabinConsumptionItems({ items, onChange, onRemove }) {
  return (
    <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
      <div><h2 className="text-xl text-primary">Cantidades utilizadas</h2><p className="mt-1 text-sm text-muted">Puedes usar hasta tres decimales en gramos y mililitros</p></div>
      <div className="mt-4 space-y-3">
        {items.map(({ quantity, supply }) => (
          <div className="grid gap-3 rounded-xl border border-surface-hover bg-background p-4 sm:grid-cols-[1fr_180px_44px] sm:items-end" key={supply.id}>
            <div><p className="font-semibold text-primary">{supply.name}</p><p className="text-xs text-muted">Disponible {supply.stockLabel}</p></div>
            <label className="text-xs font-semibold text-muted">Cantidad en {supply.unit}<input className="mt-1 min-h-11 w-full rounded-xl border border-surface-hover bg-surface px-3 text-sm text-primary outline-none focus:border-primary" inputMode="decimal" min="0" onChange={(event) => onChange(supply.id, event.target.value)} placeholder="0" step={supply.unit === 'pieza' ? '1' : '0.001'} type="number" value={quantity} /></label>
            <button aria-label={`Quitar ${supply.name}`} className="grid size-11 place-items-center rounded-xl border border-error/20 text-error transition hover:bg-error/10" onClick={() => onRemove(supply.id)} type="button"><FiTrash2 aria-hidden="true" /></button>
          </div>
        ))}
        {items.length === 0 && <div className="rounded-xl border border-dashed border-surface-hover px-4 py-10 text-center text-sm text-muted">Todavía no has agregado insumos</div>}
      </div>
    </section>
  );
}
