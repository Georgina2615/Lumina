import { FiPackage, FiRefreshCw } from 'react-icons/fi';
import PublicProductCard from './PublicProductCard';

// Presenta la carga los errores y los productos
export default function PublicCatalogGrid({ error, loading, onRetry, products }) {
  if (loading) {
    return (
      <div aria-label="Cargando productos" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div className="aspect-[0.72] animate-pulse rounded-[1.75rem] bg-surface-hover/60" key={item} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[2rem] border border-error/20 bg-error/5 px-6 py-14 text-center" role="alert">
        <p className="text-sm text-error">{error}</p>
        <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-surface" onClick={onRetry} type="button"><FiRefreshCw aria-hidden="true" />Intentar nuevamente</button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-surface-hover bg-background px-6 py-16 text-center">
        <FiPackage aria-hidden="true" className="mx-auto text-secondary/35" size={42} />
        <h2 className="mt-5 text-2xl text-primary">No hay productos en esta categoría</h2>
        <p className="mt-2 text-sm text-muted">Explora otra opción para conocer el catálogo disponible</p>
      </div>
    );
  }

  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{products.map((product) => <PublicProductCard key={product.id} product={product} />)}</div>;
}
