import { FiPlus } from 'react-icons/fi';
import { SearchBar } from '../../../../shared/components';

// Presenta los insumos disponibles para seleccionar
export default function CabinSupplyPicker({ onAdd, onSearch, search, supplies }) {
  return (
    <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
      <div><h2 className="text-xl text-primary">Insumos disponibles</h2><p className="mt-1 text-sm text-muted">Selecciona únicamente lo utilizado en esta atención</p></div>
      <div className="mt-4"><SearchBar ariaLabel="Buscar insumo" onChange={(event) => onSearch(event.target.value)} placeholder="Buscar por nombre o categoría" value={search} /></div>
      <div className="mt-4 grid max-h-80 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
        {supplies.map((supply) => (
          <article className="flex items-center justify-between gap-3 rounded-xl border border-surface-hover bg-background p-3" key={supply.id}>
            <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-primary">{supply.name}</h3><p className="text-xs text-muted">{supply.category} · {supply.stockLabel}</p></div>
            <button aria-label={`Agregar ${supply.name}`} className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-surface transition hover:bg-secondary" onClick={() => onAdd(supply)} type="button"><FiPlus aria-hidden="true" /></button>
          </article>
        ))}
        {supplies.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted">No hay más insumos disponibles</p>}
      </div>
    </section>
  );
}
