import { useState } from 'react';
import {
  cancellationOrigin
} from '../services/AppointmentService';
import AppointmentModalShell from './AppointmentModalShell';

// Obtiene la descripción histórica del anticipo
const getDepositOutcomeLabel = (outcome, reschedulingState) => {
  if (outcome === 'retenido') {
    return 'Anticipo retenido por Lumina Skin';
  }

  if (outcome === 'disponible_reprogramacion') {
    if (reschedulingState === 'utilizada') {
      return 'Anticipo aplicado a la cita reprogramada';
    }

    return 'Anticipo disponible para reprogramación';
  }

  if (outcome === 'no_aplica') {
    return 'Sin anticipo registrado';
  }

  return null;
};

// Presenta el detalle y la cancelación protegida
export default function CancelAppointmentModal({
  appointment,
  canCancel,
  error,
  isSubmitting,
  onClose,
  onConfirm
}) {
  // Conserva el origen y motivo real
  const [origin, setOrigin] = useState('');
  const [reason, setReason] = useState('');

  // Confirma una cancelación trazable
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canCancel || !origin || isSubmitting || reason.trim().length < 5) {
      return;
    }

    await onConfirm(reason, origin);
  };

  // Obtiene los datos históricos disponibles
  const cancellation = appointment?.cancelacion;
  const noShow = appointment?.inasistencia;
  const confirmation = appointment?.confirmacion;
  const depositOutcome = cancellation?.anticipoResultado
    || noShow?.anticipoResultado;
  const depositLabel = getDepositOutcomeLabel(
    depositOutcome,
    appointment?.reprogramacion?.estado
  );

  // Devuelve el modal accesible
  return (
    <AppointmentModalShell appointment={appointment}
      eyebrow={canCancel ? 'Cancelación de cita' : 'Detalle de cita'}
      isSubmitting={isSubmitting} onClose={onClose}
      title={canCancel ? 'Cancelar cita' : 'Información de la cita'}>
      <div className="grid grid-cols-2 gap-3 py-5 text-sm">
        <div className="rounded-2xl bg-surface p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Fecha</p>
          <p className="mt-1 font-semibold text-primary">{appointment?.fecha}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Hora</p>
          <p className="mt-1 font-semibold text-primary">{appointment?.hora}</p>
        </div>
        <div className="col-span-2 rounded-2xl bg-surface p-3">
          <p className="text-xs uppercase tracking-wider text-muted">Servicio</p>
          <p className="mt-1 font-semibold text-primary">{appointment?.servicio}</p>
        </div>
      </div>

      {canCancel ? (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-primary">
              Quién solicita la cancelación
            </legend>
            <div className="grid grid-cols-2 gap-3">
              <button aria-pressed={origin === cancellationOrigin.client}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  origin === cancellationOrigin.client
                    ? 'border-primary bg-primary text-surface'
                    : 'border-surface-hover bg-surface text-muted'
                }`} disabled={isSubmitting}
                onClick={() => setOrigin(cancellationOrigin.client)}
                type="button">Cliente</button>
              <button aria-pressed={origin === cancellationOrigin.clinic}
                className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  origin === cancellationOrigin.clinic
                    ? 'border-primary bg-primary text-surface'
                    : 'border-surface-hover bg-surface text-muted'
                }`} disabled={isSubmitting}
                onClick={() => setOrigin(cancellationOrigin.clinic)}
                type="button">Lumina Skin</button>
            </div>
          </fieldset>

          {appointment?.anticipoPagado && origin && (
            <div className="rounded-2xl border border-status-pending/40 bg-status-pending/15 p-4 text-sm text-primary">
              {origin === cancellationOrigin.clinic
                ? 'El anticipo quedará disponible para reprogramar'
                : 'El anticipo quedará retenido por Lumina Skin'}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary"
              htmlFor="cancellation-reason">Motivo de cancelación</label>
            <textarea data-dialog-initial-focus
              className="min-h-28 w-full resize-none rounded-2xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="cancellation-reason" maxLength={500} minLength={5}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe brevemente por qué se cancela"
              required value={reason} />
          </div>

          {error && (
            <div aria-live="assertive"
              className="rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
              role="alert">{error}</div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="rounded-xl border border-surface-hover px-5 py-3 font-semibold text-muted transition hover:bg-surface-hover"
              disabled={isSubmitting} onClick={onClose}
              type="button">Volver</button>
            <button className="rounded-xl bg-error px-5 py-3 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
              disabled={isSubmitting || !origin || reason.trim().length < 5}
              type="submit">
              {isSubmitting ? 'Cancelando cita' : 'Confirmar cancelación'}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-surface-hover bg-surface p-4 text-sm text-muted">
          <p className="font-semibold text-primary">
            Esta cita ya no admite cancelación
          </p>
          {confirmation?.canal && (
            <p className="mt-2">Confirmación mediante {confirmation.canal}</p>
          )}
          {cancellation?.origen && (
            <p className="mt-2">Cancelación solicitada por {cancellation.origen}</p>
          )}
          {(cancellation?.motivo || noShow?.motivo) && (
            <p className="mt-2">
              Motivo registrado {cancellation?.motivo || noShow?.motivo}
            </p>
          )}
          {depositLabel && (
            <p className="mt-2 font-semibold text-primary">{depositLabel}</p>
          )}
        </div>
      )}
    </AppointmentModalShell>
  );
}
