import { useAccessibleDialog } from '../../../shared/hooks';

// Presenta la estructura accesible de acciones sobre citas
export default function AppointmentModalShell({
  appointment,
  title,
  eyebrow,
  isSubmitting,
  onClose,
  children
}) {
  // Conecta el control compartido del diálogo
  const dialogRef = useAccessibleDialog({
    isOpen: Boolean(appointment),
    onRequestClose: onClose,
    canClose: !isSubmitting,
    focusKey: appointment?.id ?? 'closed'
  });

  // Evita renderizar un diálogo vacío
  if (!appointment) {
    return null;
  }

  // Devuelve la estructura visual compartida
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4 backdrop-blur-sm">
      <div
        aria-labelledby="appointment-action-title"
        aria-modal="true"
        className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-surface-hover bg-background p-6 shadow-2xl"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-hover pb-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
            <h2
              className="font-title text-2xl font-bold text-primary"
              id="appointment-action-title"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">{appointment.nombreCompleto}</p>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-full p-2 text-xl text-muted transition hover:bg-surface-hover hover:text-primary"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
