import { FiAlertCircle, FiLoader, FiPackage, FiRefreshCw } from 'react-icons/fi';
import { SearchBar } from '../../common/components';
import POSProductCard from './POSProductCard';

// Presenta el estado real del catálogo comercial
export default function POSCatalog({
  products,
  productsLoading,
  productsError,
  searchQuery,
  cartQuantities,
  hasAppointment,
  interactionLocked,
  onAdd,
  onRetry,
  onSearchChange
}) {
  // Detecta catálogo realmente vacío
  const showEmptyCatalog = !productsLoading
    && !productsError
    && products.length === 0
    && !searchQuery;
  // Detecta búsqueda sin coincidencias
  const showEmptySearch = !productsLoading
    && !productsError
    && products.length === 0
    && Boolean(searchQuery);

  // Devuelve estados reales del catálogo
  return (
    <section
      aria-labelledby="product-catalog-title"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm"
    >
      <div className="border-b border-surface-hover bg-background/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 id="product-catalog-title" className="text-lg text-primary">
              Productos
            </h2>
            <p className="text-xs text-muted">Catálogo disponible en sucursal</p>
          </div>
          {!productsLoading && !productsError && (
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-secondary">
              {products.length} resultados
            </span>
          )}
        </div>
        <SearchBar
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          ariaLabel="Buscar productos del catálogo"
          placeholder="Buscar por nombre o categoría"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {productsLoading && (
          <div
            role="status"
            className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-muted"
          >
            <FiLoader aria-hidden="true" className="animate-spin text-2xl" />
            <p className="text-sm font-medium">Cargando productos reales</p>
          </div>
        )}

        {productsError && (
          <div
            role="alert"
            className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center"
          >
            <FiAlertCircle aria-hidden="true" className="text-3xl text-error" />
            <h3 className="mt-3 text-lg text-primary">No pudimos cargar el catálogo</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">{productsError}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <FiRefreshCw aria-hidden="true" />
              Reintentar
            </button>
          </div>
        )}

        {showEmptyCatalog && (
          <div className="flex h-full min-h-64 flex-col items-center justify-center px-6 text-center text-muted">
            <FiPackage aria-hidden="true" className="text-4xl opacity-40" />
            <h3 className="mt-3 text-lg text-primary">Catálogo sin productos</h3>
            <p className="mt-1 max-w-sm text-sm">
              {hasAppointment
                ? 'Puedes cobrar el servicio sin agregar productos'
                : 'Admin deberá registrar productos antes de una venta de mostrador'}
            </p>
          </div>
        )}

        {showEmptySearch && (
          <div className="flex h-full min-h-64 items-center justify-center text-center">
            <p className="text-sm text-muted">
              No hay productos que coincidan con la búsqueda
            </p>
          </div>
        )}

        {!productsLoading && !productsError && products.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <POSProductCard
                key={product.id}
                product={product}
                cartQuantity={cartQuantities.get(product.id) ?? 0}
                interactionLocked={interactionLocked}
                onAdd={onAdd}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
