import { FiAlertTriangle, FiImage } from 'react-icons/fi';

// Presenta identidad comercial y advertencias heredadas
export default function RetailProductIdentity({ product, compact = false }) {
  // Devuelve una identidad reutilizable
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`${compact ? 'h-12 w-12' : 'h-16 w-16'} flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-hover bg-background text-muted`}>
        {product.imageUrl ? (
          <img
            alt=""
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            src={product.imageUrl}
          />
        ) : (
          <FiImage aria-hidden="true" size={20} />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-primary">{product.name}</p>
          {!product.active && (
            <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
              Inactivo
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted">
          {product.brand} · {product.category}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
          {product.sku}
        </p>
        {product.warnings.length > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-error">
            <FiAlertTriangle aria-hidden="true" />
            Requiere completar información
          </p>
        )}
      </div>
    </div>
  );
}
