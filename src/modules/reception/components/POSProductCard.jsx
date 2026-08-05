import { useState } from 'react';
import { FiPackage, FiPlus } from 'react-icons/fi';
import { formatCurrency } from '../services/SaleCalculationService';

// Presenta un producto real del catálogo
export default function POSProductCard({
  product,
  cartQuantity,
  interactionLocked,
  onAdd
}) {
  // Conserva únicamente la dirección que falló
  const [unavailableImageUrl, setUnavailableImageUrl] = useState(null);
  // Permite reintentar cuando cambia la imagen
  const hasAvailableImage = Boolean(
    product.imageUrl && product.imageUrl !== unavailableImageUrl
  );
  // Calcula disponibilidad visible
  const availableUnits = Math.max(product.stock - cartQuantity, 0);
  // Detecta producto agotado
  const soldOut = availableUnits === 0;
  // Detecta existencia baja
  const lowStock = availableUnits <= product.lowStockThreshold;

  // Devuelve una tarjeta comercial
  return (
    <article className="group flex min-h-72 flex-col overflow-hidden rounded-2xl border border-surface-hover bg-background shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-surface">
        {hasAvailableImage ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            onError={() => setUnavailableImageUrl(product.imageUrl)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted/60">
            <FiPackage aria-hidden="true" className="text-4xl" />
            <span className="text-xs font-medium">Sin imagen</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-secondary shadow-sm">
          {product.category}
        </span>
        {product.recommended && (
          <span className="absolute right-3 top-3 rounded-full bg-status-confirmed px-2.5 py-1 text-[11px] font-semibold text-surface shadow-sm">
            Recomendado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-primary">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="font-title text-xl font-bold text-primary">
              {formatCurrency(product.priceCents)}
            </p>
            <p className={`mt-0.5 text-[11px] font-semibold ${
              lowStock ? 'text-error' : 'text-muted'
            }`}>
              {soldOut
                ? 'Sin unidades disponibles'
                : `${availableUnits} disponibles`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAdd(product)}
            disabled={soldOut || interactionLocked}
            aria-label={`Agregar ${product.name}`}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-surface shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:bg-surface-hover disabled:text-muted disabled:shadow-none"
          >
            <FiPlus aria-hidden="true" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}
