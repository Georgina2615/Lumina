import { FiMessageCircle, FiPackage } from 'react-icons/fi';
import PublicCard from '../../components/PublicCard';
import { formatCatalogPrice } from '../services/PublicCatalogPolicy';

// Construye el enlace de orientación para un producto
const getProductContactUrl = (productName) => {
  const message = encodeURIComponent(`Hola quiero saber más sobre ${productName}`);
  return `https://wa.me/529811017687?text=${message}`;
};

// Presenta un producto sin exponer información interna
export default function PublicProductCard({ product }) {
  return (
    <PublicCard className="flex h-full flex-col overflow-hidden">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-white via-surface to-brand-blush/55 p-5 sm:aspect-square">
        <span aria-hidden="true" className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-gold/15 blur-2xl transition duration-500 group-hover:scale-125 motion-reduce:transform-none" />
        {product.imageUrl ? (
          <img alt={product.name} className="relative h-full w-full object-contain drop-shadow-sm transition duration-500 group-hover:scale-[1.04] motion-reduce:transform-none" loading="lazy" src={product.imageUrl} />
        ) : (
          <FiPackage aria-hidden="true" className="text-secondary/35" size={52} />
        )}
        <span className="absolute left-4 top-4 rounded-full border border-brand-blush bg-background/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary shadow-sm backdrop-blur">
          {product.category}
        </span>
      </div>
      <div aria-hidden="true" className="h-px bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent" />

      <div className="flex flex-1 flex-col p-5">
        {product.brand && <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">{product.brand}</p>}
        <h2 className="mt-2 text-xl leading-snug text-primary">{product.name}</h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {product.description || 'Producto disponible para complementar tu cuidado en casa'}
        </p>

        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between gap-3">
            <p className="text-2xl font-title font-bold text-primary">{formatCatalogPrice(product.priceCents)}</p>
            <p className={`mt-1 text-xs font-semibold ${product.available ? 'text-status-confirmed' : 'text-error'}`}>
              {product.available ? 'Disponible' : 'Agotado por el momento'}
            </p>
          </div>
          {product.available && (
            <a className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-surface shadow-md shadow-primary/10 transition duration-300 hover:-translate-y-0.5 hover:bg-brand-espresso active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 motion-reduce:transform-none" href={getProductContactUrl(product.name)} rel="noreferrer" target="_blank">
              <FiMessageCircle aria-hidden="true" />
              Consultar producto
            </a>
          )}
        </div>
      </div>
    </PublicCard>
  );
}
