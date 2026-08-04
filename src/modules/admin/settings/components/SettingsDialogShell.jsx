import { FiX } from 'react-icons/fi';
import { useAccessibleDialog } from '../../../../shared/hooks';

// Presenta una estructura accesible para configuracion
export default function SettingsDialogShell({
  busy,
  children,
  description,
  eyebrow,
  focusKey,
  onClose,
  title,
  wide = false
}) {
  const dialogRef = useAccessibleDialog({
    canClose: !busy,
    focusKey,
    isOpen: true,
    onRequestClose: onClose
  });

  // Devuelve el fondo y el panel del dialogo
  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch justify-center overflow-y-auto bg-primary/45 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby={description ? 'settings-dialog-description' : undefined}
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        className={`my-auto flex max-h-dvh min-h-dvh w-full flex-col overflow-hidden border-surface-hover bg-background shadow-2xl outline-none sm:min-h-0 sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-3xl sm:border ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-surface-hover bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            {eyebrow && (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
                {eyebrow}
              </p>
            )}
            <h2
              className="text-2xl text-primary"
              data-dialog-initial-focus
              id="settings-dialog-title"
              tabIndex={-1}
            >
              {title}
            </h2>
            {description && (
              <p
                className="mt-1 max-w-xl text-sm text-muted"
                id="settings-dialog-description"
              >
                {description}
              </p>
            )}
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-xl p-2 text-muted transition hover:bg-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            <FiX aria-hidden="true" size={20} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </section>
    </div>
  );
}
