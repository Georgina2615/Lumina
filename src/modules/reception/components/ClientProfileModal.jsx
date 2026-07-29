import { useEffect, useRef, useState } from 'react';

const focusableSelector = 'button:not([disabled]), input:not([disabled]), [href]';

// Aísla el estado editable de cada cliente
function ClientProfileDialog({ client, onClose, onUpdateContact }) {
  const [phone, setPhone] = useState(() => client.telefono || '');
  const [email, setEmail] = useState(() => client.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const dialogRef = useRef(null);
  const phoneRef = useRef(null);

  // Restaura el foco al cerrar
  useEffect(() => {
    const returnFocusElement = document.activeElement;
    phoneRef.current?.focus();
    return () => {
      if (returnFocusElement instanceof HTMLElement) {
        returnFocusElement.focus();
      }
    };
  }, []);

  // Cierra cuando no existe una operación activa
  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  // Mantiene el teclado dentro del diálogo
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && !isSaving) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }

    const controls = dialogRef.current?.querySelectorAll(focusableSelector);
    if (!controls?.length) {
      event.preventDefault();
      return;
    }
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];
    const target = event.shiftKey && document.activeElement === firstControl
      ? lastControl
      : !event.shiftKey && document.activeElement === lastControl
        ? firstControl
        : null;
    if (target) {
      event.preventDefault();
      target.focus();
    }
  };

  // Guarda el contacto con la API heredada
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onUpdateContact(client.id, {
        telefono: phone,
        email: email.trim() || null
      });
      onClose();
    } catch (updateError) {
      setError(updateError.message || 'No pudimos actualizar el contacto');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4 backdrop-blur-sm">
      <div aria-labelledby="client-profile-title" aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-surface-hover bg-background p-6 shadow-2xl"
        onKeyDown={handleKeyDown} ref={dialogRef} role="dialog">
        <header className="mb-5 flex items-start justify-between gap-4 border-b border-surface-hover pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Directorio</p>
            <h2 className="mt-1 font-title text-2xl font-bold text-primary" id="client-profile-title">
              Perfil del cliente
            </h2>
          </div>
          <button aria-label="Cerrar" className="rounded-full p-2 text-xl text-muted transition hover:bg-surface-hover hover:text-primary disabled:opacity-50"
            disabled={isSaving} onClick={handleClose} type="button">×</button>
        </header>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-surface p-4">
            <p className="text-xs font-semibold text-muted">Nombre completo</p>
            <p className="mt-1 font-semibold text-primary">{client.nombreCompleto}</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="client-profile-phone">
              Teléfono
            </label>
            <input autoComplete="tel-national"
              className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="client-profile-phone" inputMode="numeric" maxLength={10}
              onChange={(event) => setPhone(event.target.value)} pattern="[0-9]{10}"
              ref={phoneRef} required type="tel" value={phone} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="client-profile-email">
              Correo electrónico <span className="ml-2 font-normal">Opcional</span>
            </label>
            {client.emailPendienteCorreccion && (
              <p className="mb-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
                id="client-profile-email-warning" role="alert">
                El correo heredado está incompleto Corrígelo o bórralo antes de guardar
              </p>
            )}
            <input autoComplete="email"
              aria-describedby={client.emailPendienteCorreccion ? 'client-profile-email-warning' : undefined}
              className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="client-profile-email" maxLength={160}
              onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-surface-hover bg-surface p-4 text-sm">
            <span className="font-semibold text-muted">Consentimiento</span>
            <span className={client.consentimientoFirmado
              ? 'font-semibold text-status-confirmed' : 'font-semibold text-error'}>
              {client.consentimientoFirmado ? 'Firma registrada' : 'Sin firma'}
            </span>
          </div>
          {error && (
            <div aria-live="assertive" className="rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
              role="alert">{error}</div>
          )}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button className="rounded-xl border border-surface-hover px-5 py-3 font-semibold text-muted transition hover:bg-surface-hover disabled:opacity-50"
              disabled={isSaving} onClick={handleClose} type="button">Cancelar</button>
            <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-surface transition hover:opacity-90 disabled:opacity-50"
              disabled={isSaving} type="submit">
              {isSaving ? 'Actualizando contacto' : 'Actualizar contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Presenta la edición de contacto del cliente
export default function ClientProfileModal({
  cliente: client,
  isOpen,
  onClose,
  onUpdateContact
}) {
  if (!isOpen || !client) {
    return null;
  }
  return (
    <ClientProfileDialog
      client={client}
      key={client.id}
      onClose={onClose}
      onUpdateContact={onUpdateContact}
    />
  );
}
