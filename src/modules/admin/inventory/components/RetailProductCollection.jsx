import { FiPackage } from 'react-icons/fi';
import { formatInventoryCurrency } from '../services/RetailInventoryPolicy';
import RetailProductActions from './RetailProductActions';
import RetailProductIdentity from './RetailProductIdentity';
import RetailProductStock from './RetailProductStock';

// Presenta un producto en pantallas compactas
const RetailProductCard = ({ product, actions }) => (
  <article className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm transition duration-200 hover:border-secondary/30 hover:shadow-md">
    <RetailProductIdentity product={product} />
    <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-background p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Precio de venta
        </p>
        <p className="mt-1 font-semibold text-primary">
          {formatInventoryCurrency(product.priceCents)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Costo promedio por unidad
        </p>
        <p className="mt-1 font-semibold text-primary">
          {formatInventoryCurrency(product.averageCostCents)}
        </p>
      </div>
    </div>
    <div className="mb-4 flex items-start justify-between gap-4">
      <RetailProductStock detailed product={product} />
    </div>
    <RetailProductActions product={product} {...actions} />
  </article>
);

// Presenta inventario en formato tabular amplio
const RetailProductTable = ({ products, actions }) => (
  <div className="hidden overflow-x-auto lg:block">
    <table className="w-full min-w-[1050px] border-collapse text-left">
      <thead className="bg-background text-[11px] uppercase tracking-[0.12em] text-muted">
        <tr>
          <th className="px-5 py-3 font-semibold">Producto</th>
          <th className="px-4 py-3 font-semibold">Precio de venta</th>
          <th className="px-4 py-3 font-semibold">Costo promedio por unidad</th>
          <th className="px-4 py-3 text-right font-semibold">Cantidad disponible</th>
          <th className="px-5 py-3 text-right font-semibold">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-hover">
        {products.map((product) => (
          <tr
            className="transition-colors hover:bg-background/55"
            key={product.id}
          >
            <td className="px-5 py-4">
              <RetailProductIdentity compact product={product} />
            </td>
            <td className="px-4 py-4 font-semibold text-primary">
              {formatInventoryCurrency(product.priceCents)}
            </td>
            <td className="px-4 py-4 text-sm text-muted">
              {formatInventoryCurrency(product.averageCostCents)}
            </td>
            <td className="px-4 py-4">
              <RetailProductStock product={product} />
            </td>
            <td className="px-5 py-4">
              <RetailProductActions compact product={product} {...actions} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Coordina estados y formatos de la colección
export default function RetailProductCollection({
  actions,
  loading,
  onReset,
  products,
  totalCount
}) {
  // Presenta esqueletos durante la primera carga
  if (loading) {
    return (
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-1">
        {[1, 2, 3, 4].map((item) => (
          <div
            className="h-28 rounded-2xl bg-surface-hover/60 motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    );
  }

  // Explica cuando la consulta local no encuentra coincidencias
  if (products.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
          <FiPackage aria-hidden="true" size={24} />
        </span>
        <h2 className="text-xl text-primary">
          {totalCount === 0 ? 'No hay productos registrados' : 'Sin coincidencias'}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          {totalCount === 0
            ? 'Crea el primer producto para usarlo en Punto de Venta'
            : 'Prueba otra búsqueda o restablece los filtros actuales'}
        </p>
        {totalCount > 0 && (
          <button
            className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:shadow-md"
            onClick={onReset}
            type="button"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    );
  }

  // Devuelve tabla amplia y tarjetas compactas
  return (
    <>
      <RetailProductTable actions={actions} products={products} />
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
        {products.map((product) => (
          <RetailProductCard
            actions={actions}
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </>
  );
}
