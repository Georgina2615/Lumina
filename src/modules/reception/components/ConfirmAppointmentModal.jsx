import { useState } from 'react';
import { confirmationChannel } from '../services/AppointmentService';
import AppointmentModalShell from './AppointmentModalShell';

// Define los canales de confirmación disponibles
const confirmationOptions = [
  { value: confirmationChannel.email, label: 'Correo' },
  { value: confirmationChannel.phoneCall, label: 'Llamada' },
  { value: confirmationChannel.whatsapp, label: 'WhatsApp' },
  { value: confirmationChannel.inPerson, label: 'Presencial' }
];

// Solicita el canal real de confirmación
export default function ConfirmAppointmentModal({
  appointment,
  clientContact,
  error,
  isSubmitting,
  onClose,
  onConfirm
}) {
  // Reconoce un correo vigente desde el perfil del cliente
  const hasEmail = Boolean(clientContact?.email);

  // Selecciona un canal compatible con el contacto real
  const [channel, setChannel] = useState(
    hasEmail
      ? confirmationChannel.email
      : confirmationChannel.phoneCall
  );

  // Confirma la asistencia con trazabilidad
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      isSubmitting
      || (
        channel === confirmationChannel.email
        && !hasEmail
      )
    ) {
      return;
    }

    await onConfirm(channel);
  };

  // Devuelve el formulario de confirmación
  return (
    <AppointmentModalShell appointment={appointment}
      eyebrow="Confirmación de asistencia" isSubmitting={isSubmitting}
      onClose={onClose} title="Confirmar cita">
      <form className="flex flex-col gap-5 pt-5" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold text-primary">
            Cómo confirmó la clienta
          </p>
        </div>

        <fieldset>
          <legend className="sr-only">Canal de confirmación</legend>
          <div className="grid grid-cols-2 gap-3">
            {confirmationOptions.map((option) => {
              const disabled = option.value === confirmationChannel.email
                && !hasEmail;

              return (
                <button aria-pressed={channel === option.value}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    channel === option.value
                      ? 'border-primary bg-primary text-surface shadow-sm'
                      : 'border-surface-hover bg-surface text-muted hover:border-primary/30 hover:text-primary'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                  disabled={disabled || isSubmitting} key={option.value}
                  onClick={() => setChannel(option.value)} type="button">
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {!hasEmail && (
          <p className="rounded-2xl border border-status-pending/30 bg-status-pending/15 p-3 text-sm text-primary">
            Esta clienta no tiene correo registrado y requiere contacto manual
          </p>
        )}

        {clientContact?.phone && (
          <a className="rounded-2xl bg-surface p-3 text-sm font-semibold text-secondary transition hover:bg-surface-hover"
            href={`tel:${clientContact.phone}`}>
            Llamar al {clientContact.phone}
          </a>
        )}

        {error && (
          <div aria-live="assertive"
            className="rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
            role="alert">{error}</div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="rounded-xl border border-surface-hover px-5 py-3 font-semibold text-muted transition hover:bg-surface-hover"
            disabled={isSubmitting} onClick={onClose} type="button">Volver</button>
          <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
            disabled={
              isSubmitting
              || (
                channel === confirmationChannel.email
                && !hasEmail
              )
            } type="submit">
            {isSubmitting ? 'Confirmando cita' : 'Registrar confirmación'}
          </button>
        </div>
      </form>
    </AppointmentModalShell>
  );
}
