import { FiLoader, FiRepeat } from 'react-icons/fi';
import { useStockMovementForm } from '../hooks/UseStockMovementForm';
import InventoryDialogShell from './InventoryDialogShell';
import StockMovementFields from './StockMovementFields';

// Coordina cambios en la cantidad disponible
export default function StockMovementModal({
  busy,
  error,
  mode,
  onClose,
  onSubmit,
  product
}) {
  const {
    form,
    submitForm,
    updateField,
    validationError
  } = useStockMovementForm({ mode, onSubmit, product });

  // Devuelve el movimiento seleccionado
  return (
    <InventoryDialogShell
      busy={busy}
      description={`${product.name} · ${product.sku}`}
      eyebrow="Cambio de inventario"
      focusKey={`${product.id}-${mode}`}
      onClose={onClose}
      open={Boolean(product)}
      title={mode === 'replenish' ? 'Agregar unidades' : 'Corregir cantidad'}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <div className="p-5 sm:p-6">
          <StockMovementFields
            form={form}
            onChange={updateField}
            product={product}
          />
          {(validationError || error) && (
            <p
              className="mt-5 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error"
              role="alert"
            >
              {validationError || error}
            </p>
          )}
        </div>
        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-surface-hover bg-background/95 p-4 backdrop-blur sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-surface-hover px-5 text-sm font-semibold text-primary transition hover:bg-surface-hover/50 disabled:opacity-50"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? (
              <FiLoader aria-hidden="true" className="motion-safe:animate-spin" />
            ) : (
              <FiRepeat aria-hidden="true" />
            )}
            {busy ? 'Guardando' : 'Guardar cambio'}
          </button>
        </footer>
      </form>
    </InventoryDialogShell>
  );
}
