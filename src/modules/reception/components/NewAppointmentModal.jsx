import { useCallback, useEffect, useRef, useState } from 'react';
import ReceptionAppointmentForm from './ReceptionAppointmentForm';

// Define los controles que participan en el foco
const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href]';

// Presenta el formulario dentro de un diálogo accesible
export default function NewAppointmentModal({
  initialSlot,
  isOpen,
  onClose
}) {
  // Conserva el diálogo y el estado de guardado
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const busyRef = useRef(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    // Detiene el control cuando el diálogo está cerrado
    if (!isOpen) {
      return undefined;
    }

    returnFocusRef.current = document.activeElement;
    const firstControl = dialogRef.current?.querySelector('input:not([disabled])')
      ?? dialogRef.current?.querySelector(focusableSelector);
    firstControl?.focus();

    // Controla el teclado dentro del diálogo
    const handleKeyDown = (event) => {
      // Cierra el diálogo con teclado cuando es seguro
      if (event.key === 'Escape' && !busyRef.current) {
        onClose();
        return;
      }

      // Ignora teclas distintas al recorrido de foco
      if (event.key !== 'Tab') {
        return;
      }

      const controls = dialogRef.current?.querySelectorAll(focusableSelector);

      // Detiene el recorrido cuando no existen controles
      if (!controls?.length) {
        event.preventDefault();
        return;
      }

      const firstControlElement = controls[0];
      const lastControlElement = controls[controls.length - 1];
      const target = event.shiftKey && document.activeElement === firstControlElement
        ? lastControlElement
        : !event.shiftKey && document.activeElement === lastControlElement
          ? firstControlElement
          : null;

      // Mantiene el foco dentro del diálogo
      if (target) {
        event.preventDefault();
        target.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Restaura el foco y elimina el listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
      returnFocusRef.current = null;
    };
  }, [isOpen, onClose]);

  // Sincroniza el bloqueo visual y del teclado
  const handleSubmittingChange = useCallback((nextIsBusy) => {
    busyRef.current = nextIsBusy;
    setIsBusy(nextIsBusy);
  }, []);

  // Evita renderizar un diálogo cerrado
  if (!isOpen) {
    return null;
  }

  // Solicita el cierre cuando no hay una operación activa
  const handleClose = () => {
    if (!isBusy) {
      onClose();
    }
  };

  // Devuelve el diálogo de nueva cita
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-3 backdrop-blur-sm sm:p-5">
      <div
        aria-labelledby="new-appointment-title"
        aria-modal="true"
        className="max-h-[calc(100vh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-surface-hover bg-background shadow-2xl motion-safe:transition-all motion-safe:duration-200"
        ref={dialogRef}
        role="dialog"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-surface-hover bg-background/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Recepción
            </p>
            <h2 className="mt-1 font-title text-2xl font-bold text-primary" id="new-appointment-title">
              Agendar nueva cita
            </h2>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-full p-2 text-xl text-muted transition hover:bg-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isBusy}
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </header>
        <ReceptionAppointmentForm
          initialSlot={initialSlot}
          onClose={handleClose}
          onSubmittingChange={handleSubmittingChange}
        />
      </div>
    </div>
  );
}
