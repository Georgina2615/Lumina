import {
  FiEdit3,
  FiMinusCircle,
  FiPlusCircle,
  FiPower
} from 'react-icons/fi';

const actionClassName = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-surface-hover bg-background px-3 text-xs font-semibold text-primary transition duration-200 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-sm active:translate-y-0';

// Agrupa acciones permitidas sobre un producto
export default function RetailProductActions({
  compact = false,
  onAdjust,
  onEdit,
  onReplenish,
  onToggle,
  product
}) {
  // Devuelve controles consistentes para tabla y tarjeta
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'justify-end' : ''}`}>
      <button
        className={actionClassName}
        onClick={() => onEdit(product)}
        type="button"
      >
        <FiEdit3 aria-hidden="true" />
        Editar
      </button>
      <button
        className={actionClassName}
        onClick={() => onReplenish(product)}
        type="button"
      >
        <FiPlusCircle aria-hidden="true" />
        Agregar
      </button>
      <button
        className={actionClassName}
        onClick={() => onAdjust(product)}
        type="button"
      >
        <FiMinusCircle aria-hidden="true" />
        Corregir
      </button>
      <button
        className={`${actionClassName} ${product.active ? 'hover:border-error/40 hover:text-error' : 'hover:border-status-confirmed/50'}`}
        onClick={() => onToggle(product)}
        type="button"
      >
        <FiPower aria-hidden="true" />
        {product.active ? 'Desactivar' : 'Reactivar'}
      </button>
    </div>
  );
}
