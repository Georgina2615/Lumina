import { useState } from 'react';
import { useAccessibleDialog } from '../hooks/UseAccessibleDialog';

// Presenta el detalle y la cancelación protegida
export default function CancelAppointmentModal({
  appointment, canCancel, error, isSubmitting, onClose, onConfirm
}) {
  // Conserva el motivo escrito
  const [reason, setReason] = useState('');

  // Cierra y limpia el formulario
  const handleClose = () => {
    // Evita cerrar durante la operación
    if (isSubmitting) {
      return;
    }
    setReason('');
    onClose();
  };

  // Conecta el control compartido del diálogo
  const dialogRef = useAccessibleDialog({
    isOpen: Boolean(appointment),
    onRequestClose: handleClose,
    canClose: !isSubmitting,
    focusKey: appointment?.id ?? 'closed'
  });

  // Evita renderizar un modal vacío
  if (!appointment) {
    return null;
  }

  // Confirma la cancelación
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Detiene acciones no permitidas
    if (!canCancel || isSubmitting) {
      return;
    }
    try {
      await onConfirm(reason);
      setReason('');
    } catch {
      // Conserva el formulario para permitir otro intento
    }
  };

  // Obtiene el historial registrado
  const historicalReason = appointment.cancelacion?.motivo;
  const historicalDepositOutcome = appointment.cancelacion?.anticipoResultado;
  const historicalDepositLabel = historicalDepositOutcome === 'retenido'
    ? 'Anticipo retenido por la clínica'
    : historicalDepositOutcome === 'no_aplica' ? 'Sin anticipo registrado' : null;

  // Devuelve el modal accesible
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4 backdrop-blur-sm">
      <div aria-labelledby="appointment-modal-title" aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-surface-hover bg-background p-6 shadow-2xl motion-safe:transition"
        ref={dialogRef} role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-surface-hover pb-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {canCancel ? 'Cancelación de cita' : 'Detalle de cita'}
            </p>
            <h2 className="font-title text-2xl font-bold text-primary" id="appointment-modal-title">
              {appointment.nombreCompleto}
            </h2>
          </div>
          <button aria-label="Cerrar"
            className="rounded-full p-2 text-xl text-muted transition hover:bg-surface-hover hover:text-primary"
            disabled={isSubmitting} onClick={handleClose} type="button">×</button>
        </div>

        <div className="grid grid-cols-2 gap-3 py-5 text-sm">
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-muted">Fecha</p>
            <p className="mt-1 font-semibold text-primary">{appointment.fecha}</p>
          </div>
          <div className="rounded-2xl bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-muted">Hora</p>
            <p className="mt-1 font-semibold text-primary">{appointment.hora}</p>
          </div>
          <div className="col-span-2 rounded-2xl bg-surface p-3">
            <p className="text-xs uppercase tracking-wider text-muted">Servicio</p>
            <p className="mt-1 font-semibold text-primary">{appointment.servicio}</p>
          </div>
        </div>

        {canCancel ? (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {appointment.anticipoPagado && (
              <div className="rounded-2xl border border-status-pending/40 bg-status-pending/15 p-4 text-sm text-primary">
                El anticipo registrado quedará retenido por la clínica
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-semibold text-primary" htmlFor="cancellation-reason">
                Motivo de cancelación
              </label>
              <textarea data-dialog-initial-focus
                className="min-h-28 w-full resize-none rounded-2xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                id="cancellation-reason" maxLength={500} minLength={5}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Describe brevemente por qué se cancela" required value={reason} />
            </div>
            {error && (
              <div aria-live="assertive"
                className="rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
                role="alert">{error}</div>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button className="rounded-xl border border-surface-hover px-5 py-3 font-semibold text-muted transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting} onClick={handleClose} type="button">Volver</button>
              <button className="rounded-xl bg-error px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                disabled={isSubmitting || reason.trim().length < 5} type="submit">
                {isSubmitting ? 'Cancelando cita' : 'Confirmar cancelación'}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border border-surface-hover bg-surface p-4 text-sm text-muted">
            <p className="font-semibold text-primary">Esta cita ya no admite cancelación</p>
            {historicalReason && <p className="mt-2">Motivo registrado: {historicalReason}</p>}
            {historicalDepositLabel && (
              <p className="mt-2 font-semibold text-primary">{historicalDepositLabel}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
