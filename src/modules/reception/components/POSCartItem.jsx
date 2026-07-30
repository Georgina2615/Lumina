import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../services/SaleCalculationService';

// Presenta una línea del cobro
export default function POSCartItem({
  item,
  interactionLocked,
  onChangeQuantity,
  onRemove
}) {
  // Distingue líneas protegidas
  const isService = item.type === 'service';

  // Devuelve una línea interactiva
  return (
    <li className={`rounded-xl border bg-background p-3 transition ${
      item.available
        ? 'border-surface-hover hover:border-primary/30'
        : 'border-error/30 bg-error/5'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-primary">
              {item.name}
            </h3>
            {isService && (
              <span className="rounded-full border border-status-confirmed/30 bg-status-confirmed/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Cita
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatCurrency(item.unitPriceCents)} por unidad
          </p>
          {!item.available && (
            <p className="mt-1 text-xs font-semibold text-error">
              Existencias insuficientes
            </p>
          )}
        </div>
        <p className="shrink-0 font-title text-base font-bold text-primary">
          {formatCurrency(item.unitPriceCents * item.quantity)}
        </p>
      </div>

      {!isService && (
        <div className="mt-3 flex items-center justify-between border-t border-surface-hover pt-3">
          <div
            aria-label={`Cantidad de ${item.name}`}
            className="inline-flex items-center rounded-lg border border-surface-hover bg-surface"
          >
            <button
              type="button"
              onClick={() => onChangeQuantity(item.id, -1)}
              disabled={interactionLocked}
              aria-label={`Quitar una unidad de ${item.name}`}
              className="p-2 text-muted transition hover:bg-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiMinus aria-hidden="true" />
            </button>
            <span className="min-w-9 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onChangeQuantity(item.id, 1)}
              disabled={interactionLocked}
              aria-label={`Agregar una unidad de ${item.name}`}
              className="p-2 text-muted transition hover:bg-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiPlus aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={interactionLocked}
            aria-label={`Eliminar ${item.name}`}
            className="rounded-lg p-2 text-muted transition hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FiTrash2 aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}
