import { useState } from 'react';
import AppointmentModalShell from './AppointmentModalShell';

// Solicita evidencia operativa de una inasistencia
export default function NoShowAppointmentModal({
  appointment,
  error,
  isSubmitting,
  onClose,
  onConfirm
}) {
  // Conserva la observación escrita
  const [reason, setReason] = useState('');

  // Registra la inasistencia confirmada
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting || reason.trim().length < 5) {
      return;
    }

    await onConfirm(reason);
  };

  // Devuelve el formulario protegido
  return (
    <AppointmentModalShell appointment={appointment}
      eyebrow="Control de asistencia" isSubmitting={isSubmitting}
      onClose={onClose} title="Registrar inasistencia">
      <form className="flex flex-col gap-4 pt-5" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-status-pending/40 bg-status-pending/15 p-4 text-sm text-primary">
          La cita saldrá del tablero pero permanecerá visible en la agenda
          {appointment?.anticipoPagado && ' y el anticipo quedará retenido'}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-primary"
            htmlFor="no-show-reason">Motivo u observación</label>
          <textarea data-dialog-initial-focus
            className="min-h-28 w-full resize-none rounded-2xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            id="no-show-reason" maxLength={500} minLength={5}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Describe cómo se comprobó la inasistencia"
            required value={reason} />
        </div>

        {error && (
          <div aria-live="assertive"
            className="rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
            role="alert">{error}</div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="rounded-xl border border-surface-hover px-5 py-3 font-semibold text-muted transition hover:bg-surface-hover"
            disabled={isSubmitting} onClick={onClose} type="button">Volver</button>
          <button className="rounded-xl bg-error px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            disabled={isSubmitting || reason.trim().length < 5} type="submit">
            {isSubmitting ? 'Registrando' : 'Confirmar inasistencia'}
          </button>
        </div>
      </form>
    </AppointmentModalShell>
  );
}
