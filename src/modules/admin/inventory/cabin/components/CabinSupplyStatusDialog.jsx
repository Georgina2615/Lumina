import { FiLoader, FiPower } from 'react-icons/fi';
import InventoryDialogShell from '../../components/InventoryDialogShell';

// Confirma cambios de disponibilidad interna
export default function CabinSupplyStatusDialog({
  busy,
  error,
  onClose,
  onConfirm,
  supply
}) {
  const nextActive = !supply.active;

  // Devuelve una confirmación sin eliminar historial
  return (
    <InventoryDialogShell
      busy={busy}
      description={supply.name}
      eyebrow="Insumo"
      focusKey={supply.id}
      onClose={onClose}
      open
      title={nextActive ? 'Reactivar insumo' : 'Desactivar insumo'}
    >
      <div className="p-5 sm:p-6">
        <div className={`rounded-2xl border p-4 ${nextActive ? 'border-status-confirmed/30 bg-status-confirmed/10' : 'border-status-pending/40 bg-status-pending/10'}`}>
          <p className="text-sm leading-relaxed text-primary">
            {nextActive
              ? 'El insumo volverá a estar disponible para uso en cabina'
              : 'El insumo dejará de estar disponible pero conservará sus cantidades y registros anteriores'}
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
