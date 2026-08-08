import { FiMessageCircle, FiPackage } from 'react-icons/fi';
import { formatCatalogPrice } from '../services/PublicCatalogPolicy';

// Construye el enlace de orientación para un producto
const getProductContactUrl = (productName) => {
  const message = encodeURIComponent(`Hola quiero saber más sobre ${productName}`);
  return `https://wa.me/529811017687?text=${message}`;
};

// Presenta un producto sin exponer información interna
export default function PublicProductCard({ product }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-surface-hover bg-background shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 motion-reduce:transform-none">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-white via-surface to-status-pending/10 p-5">
        {product.imageUrl ? (
          <img alt={product.name} className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.03] motion-reduce:transform-none" loading="lazy" src={product.imageUrl} />
        ) : (
          <FiPackage aria-hidden="true" className="text-secondary/35" size={52} />
        )}
        <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary shadow-sm backdrop-blur">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {product.brand && <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">{product.brand}</p>}
        <h2 className="mt-2 text-xl leading-snug text-primary">{product.name}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {product.description || 'Producto disponible para complementar tu cuidado en casa'}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div>
            <p className="text-2xl font-title font-bold text-primary">{formatCatalogPrice(product.priceCents)}</p>
            <p className={`mt-1 text-xs font-semibold ${product.available ? 'text-status-confirmed' : 'text-error'}`}>
              {product.available ? 'Disponible' : 'Agotado por el momento'}
            </p>
          </div>
          {product.available && (
            <a aria-label={`Preguntar por ${product.name}`} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-surface transition duration-300 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2" href={getProductContactUrl(product.name)} rel="noreferrer" target="_blank">
              <FiMessageCircle aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
