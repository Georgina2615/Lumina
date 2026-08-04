import { FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import SettingsDialogShell from '../../components/SettingsDialogShell';

// Confirma la disponibilidad del servicio
export default function ServiceStatusDialog({
  busy,
  error,
  onClose,
  onConfirm,
  service
}) {
  const activating = !service.active;
  const Icon = activating ? FiEye : FiEyeOff;

  // Conserva el dialogo cuando la operacion falla
  const confirmStatus = async () => {
    try {
      await onConfirm();
    } catch {
      // Permite corregir o reintentar desde el mismo dialogo
    }
  };

  // Devuelve una confirmacion explicita
  return (
    <SettingsDialogShell
      busy={busy}
      focusKey={`${service.id}-${activating}`}
      onClose={onClose}
      title={activating
        ? 'Mostrar en la agenda'
        : 'Ocultar de la agenda'}
    >
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3 rounded-2xl border border-surface-hover bg-surface p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-secondary">
            <Icon aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-primary">{service.displayName}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {activating
                ? 'El servicio podrá seleccionarse al crear nuevas citas.'
                : 'No aparecerá en nuevas citas. Las citas existentes conservarán sus datos.'}
            </p>
          </div>
        </div>

        {error && (
          <p
            className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            className="min-h-11 rounded-xl border border-surface-hover px-5 text-sm font-semibold text-primary transition hover:bg-surface-hover/50 disabled:opacity-50"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface transition motion-safe:hover:-translate-y-0.5 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            onClick={confirmStatus}
            type="button"
          >
            {busy ? (
              <FiLoader aria-hidden="true" className="motion-safe:animate-spin" />
            ) : (
              <Icon aria-hidden="true" />
            )}
            {busy ? 'Guardando' : activating ? 'Mostrar' : 'Ocultar'}
          </button>
        </div>
      </div>
    </SettingsDialogShell>
  );
}
