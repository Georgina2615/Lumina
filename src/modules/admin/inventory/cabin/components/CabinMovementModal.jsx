import { FiLoader, FiRepeat } from 'react-icons/fi';
import InventoryDialogShell from '../../components/InventoryDialogShell';
import { useCabinMovementForm } from '../hooks/UseCabinMovementForm';
import CabinMovementFields from './CabinMovementFields';

// Coordina entradas salidas y ajustes auditables
export default function CabinMovementModal({
  busy,
  error,
  mode,
  onClose,
  onSubmit,
  supply
}) {
  const {
    form,
    submitForm,
    updateField,
    validationError
  } = useCabinMovementForm({ mode, onSubmit, supply });

  // Devuelve el movimiento seleccionado
  return (
    <InventoryDialogShell
      busy={busy}
      description={`${supply.name} · control por ${supply.unit}`}
      eyebrow="Movimiento auditable"
      focusKey={`${supply.id}-${mode}`}
      onClose={onClose}
      open
      title={mode === 'replenish' ? 'Registrar entrada' : 'Ajustar existencias'}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitForm();
        }}
      >
        <div className="p-5 sm:p-6">
          <CabinMovementFields
            form={form}
            mode={mode}
            onChange={updateField}
            supply={supply}
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
            {busy ? 'Registrando' : 'Registrar movimiento'}
          </button>
        </footer>
      </form>
    </InventoryDialogShell>
  );
}
