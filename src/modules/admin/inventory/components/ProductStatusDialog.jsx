import { FiLoader, FiPower } from 'react-icons/fi';
import InventoryDialogShell from './InventoryDialogShell';

// Confirma cambios de disponibilidad comercial
export default function ProductStatusDialog({
  busy,
  error,
  onClose,
  onConfirm,
  product
}) {
  const nextActive = !product?.active;

  // Evita leer un producto inexistente
  if (!product) {
    return null;
  }

  // Devuelve una confirmación sin eliminar historial
  return (
    <InventoryDialogShell
      busy={busy}
      description={product.name}
      eyebrow="Producto"
      focusKey={product.id}
      onClose={onClose}
      open
      title={nextActive ? 'Reactivar producto' : 'Desactivar producto'}
    >
      <div className="p-5 sm:p-6">
        <div className={`rounded-2xl border p-4 ${nextActive ? 'border-status-confirmed/30 bg-status-confirmed/10' : 'border-status-pending/40 bg-status-pending/10'}`}>
          <p className="text-sm leading-relaxed text-primary">
            {nextActive
              ? 'El producto volverá a estar disponible para nuevas ventas'
              : 'El producto dejará de aparecer en Punto de Venta pero conservará sus registros anteriores'}
          </p>
        </div>
        {error && (
          <p
            className="mt-4 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
      <footer className="flex flex-col-reverse gap-2 border-t border-surface-hover bg-background p-4 sm:flex-row sm:justify-end">
        <button
          className="min-h-11 rounded-xl border border-surface-hover px-5 text-sm font-semibold text-primary transition hover:bg-surface-hover/50 disabled:opacity-50"
          disabled={busy}
          onClick={onClose}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
          disabled={busy}
          onClick={onConfirm}
          type="button"
        >
          {busy ? (
            <FiLoader aria-hidden="true" className="motion-safe:animate-spin" />
          ) : (
            <FiPower aria-hidden="true" />
          )}
          {busy ? 'Guardando' : nextActive ? 'Reactivar' : 'Desactivar'}
        </button>
      </footer>
    </InventoryDialogShell>
  );
}
