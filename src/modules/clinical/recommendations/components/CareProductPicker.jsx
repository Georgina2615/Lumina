import { FiCheck, FiSearch } from 'react-icons/fi';
import { formatRecommendationPrice } from '../services/CareRecommendationPolicy';

// Presenta productos reales para cuidado en casa
export default function CareProductPicker({ products, search, selectedIds, onSearch, onToggle }) {
  return (
    <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="text-xl text-primary">Productos para casa</h2><p className="mt-1 text-sm text-muted">Selecciona hasta ocho productos disponibles</p></div>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-secondary">{selectedIds.length} seleccionados</span>
      </div>
      <label className="mt-4 flex min-h-11 items-center gap-3 rounded-xl border border-surface-hover bg-background px-3 focus-within:ring-2 focus-within:ring-secondary/30">
        <FiSearch aria-hidden="true" className="text-muted" />
        <span className="sr-only">Buscar productos</span>
        <input className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-muted/70" onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por producto marca o categoría" type="search" value={search} />
      </label>
      <div className="mt-4 grid max-h-[26rem] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
        {products.map((product) => {
          const selected = selectedIds.includes(product.id);
          const disabled = !selected && selectedIds.length >= 8;
          return (
            <button aria-pressed={selected} className={`flex min-h-24 items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? 'border-status-confirmed/50 bg-status-confirmed/10' : 'border-surface-hover bg-background hover:border-secondary/30'} disabled:cursor-not-allowed disabled:opacity-50`} disabled={disabled} key={product.id} onClick={() => onToggle(product.id)} type="button">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                {product.imageUrl ? <img alt="" className="size-full object-cover" src={product.imageUrl} /> : <span className="text-lg text-muted">LS</span>}
              </div>
              <div className="min-w-0 flex-1"><p className="truncate font-semibold text-primary">{product.name}</p><p className="truncate text-xs text-muted">{product.brand || product.category}</p><p className="mt-1 text-sm font-semibold text-secondary">{formatRecommendationPrice(product.priceCents)}</p></div>
              {selected && <FiCheck aria-label="Seleccionado" className="shrink-0 text-status-confirmed" />}
            </button>
          );
        })}
        {products.length === 0 && <p className="col-span-full py-10 text-center text-sm text-muted">No hay productos que coincidan</p>}
      </div>
    </section>
  );
}
