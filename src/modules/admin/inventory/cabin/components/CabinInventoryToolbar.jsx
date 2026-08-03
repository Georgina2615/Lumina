import { FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
import { SearchBar } from '../../../../../shared/components';

const selectClassName = 'min-h-11 rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15';

// Presenta búsqueda filtros y acciones principales
export default function CabinInventoryToolbar({
  activityFilter,
  categories,
  categoryFilter,
  isRefreshing,
  onActivityChange,
  onCategoryChange,
  onCreate,
  onRefresh,
  onReset,
  onSearchChange,
  onStockChange,
  onUnitChange,
  search,
  stockFilter,
  unitFilter
}) {
  const hasFilters = search
    || activityFilter !== 'active'
    || categoryFilter !== 'all'
    || stockFilter !== 'all'
    || unitFilter !== 'all';

  // Devuelve controles adaptables y accesibles
  return (
    <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row">
        <div className="min-w-0 flex-1">
          <SearchBar
            ariaLabel="Buscar insumos de cabina"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por insumo marca o categoría"
            value={search}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-surface-hover bg-background px-4 text-sm font-semibold text-primary transition hover:border-secondary/40 hover:bg-surface-hover/40 active:scale-[0.98] disabled:opacity-50"
            disabled={isRefreshing}
            onClick={onRefresh}
            type="button"
          >
            <FiRefreshCw
              aria-hidden="true"
              className={isRefreshing ? 'motion-safe:animate-spin' : ''}
            />
            Actualizar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            onClick={onCreate}
            type="button"
          >
            <FiPlus aria-hidden="true" />
            Nuevo insumo
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[180px_210px_160px_180px_auto]">
        <select
          aria-label="Filtrar por disponibilidad"
          className={selectClassName}
          onChange={(event) => onActivityChange(event.target.value)}
          value={activityFilter}
        >
          <option value="active">Insumos activos</option>
          <option value="inactive">Insumos inactivos</option>
          <option value="all">Todos los estados</option>
        </select>
        <select
          aria-label="Filtrar por categoría"
          className={selectClassName}
          onChange={(event) => onCategoryChange(event.target.value)}
          value={categoryFilter}
        >
          <option value="all">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar por unidad"
          className={selectClassName}
          onChange={(event) => onUnitChange(event.target.value)}
          value={unitFilter}
        >
          <option value="all">Todas las unidades</option>
          <option value="ml">Mililitros</option>
          <option value="g">Gramos</option>
          <option value="pieza">Piezas</option>
        </select>
        <select
          aria-label="Filtrar por existencias"
          className={selectClassName}
          onChange={(event) => onStockChange(event.target.value)}
          value={stockFilter}
        >
          <option value="all">Cualquier stock</option>
          <option value="sold_out">Agotados</option>
          <option value="low">Stock bajo</option>
          <option value="healthy">Stock saludable</option>
        </select>
        {hasFilters && (
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 px-3 text-sm font-semibold text-muted transition hover:text-primary sm:col-span-2 xl:col-span-1 xl:justify-start"
            onClick={onReset}
            type="button"
          >
            <FiX aria-hidden="true" />
            Limpiar filtros
          </button>
        )}
      </div>
    </section>
  );
}
