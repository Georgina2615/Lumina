import { useState } from 'react';
import SettingsDialogShell from '../../components/SettingsDialogShell';
import { formatAvailabilityDate } from '../services/AdminAvailabilityPolicy';

// Solicita la confirmacion de un cambio de agenda
export default function AvailabilityActionDialog({
  busy,
  dialog,
  error,
  onClose,
  onConfirm
}) {
  const [reason, setReason] = useState(dialog.reason ?? '');
  const isReopening = dialog.action === 'reopen_slot';
  const isFullDay = dialog.action === 'block_day';
  const title = isReopening
    ? 'Reabrir horario'
    : isFullDay ? 'Bloquear día' : 'Bloquear horario';

  // Envia la decision elegida
  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm(reason);
  };

  // Devuelve un dialogo compacto y accesible
  return (
    <SettingsDialogShell
      busy={busy}
      description={isReopening
        ? 'Este horario podrá reservarse nuevamente'
        : isFullDay
          ? 'Solo se bloquearán los horarios que continúen libres'
          : 'Este horario dejará de aceptar citas'}
      eyebrow="Disponibilidad de agenda"
      focusKey={`${dialog.action}-${dialog.dateKey}-${dialog.time ?? 'day'}`}
      onClose={onClose}
      title={title}
    >
      <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-surface-hover bg-surface px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Fecha y horario
          </p>
          <p className="mt-1 font-semibold text-primary">
            {formatAvailabilityDate(dialog.dateKey)} · {dialog.time ?? 'Todos los horarios libres'}
          </p>
        </div>

        {!isReopening && (
          <label className="block text-sm font-semibold text-muted">
            Motivo <span className="font-normal">Opcional</span>
            <textarea
              className="mt-2 min-h-28 w-full resize-none rounded-xl border border-surface-hover bg-background px-4 py-3 text-primary outline-none transition placeholder:text-muted/60 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              maxLength={160}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ejemplo mantenimiento o ausencia"
              value={reason}
            />
          </label>
        )}

        {error && (
          <p className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-surface-hover pt-5">
          <button
            className="min-h-11 rounded-xl border border-surface-hover px-4 text-sm font-semibold text-primary transition hover:bg-surface-hover disabled:opacity-50"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition hover:bg-secondary disabled:cursor-wait disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Guardando' : isReopening ? 'Reabrir' : 'Bloquear'}
          </button>
        </div>
      </form>
    </SettingsDialogShell>
  );
}
