import { useEffect, useRef } from 'react';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

// Obtiene los controles disponibles dentro del diálogo
const getFocusableElements = (dialog) => (
  Array.from(dialog.querySelectorAll(focusableSelector))
);

// Controla foco teclado y cierre accesible
export const useAccessibleDialog = ({
  isOpen,
  onRequestClose,
  canClose = true,
  focusKey = 'default'
}) => {
  const dialogRef = useRef(null);
  const returnFocusRef = useRef(null);
  const closeHandlerRef = useRef(onRequestClose);
  const canCloseRef = useRef(canClose);

  // Sincroniza las reglas usadas por el teclado
  useEffect(() => {
    closeHandlerRef.current = onRequestClose;
    canCloseRef.current = canClose;
  }, [canClose, onRequestClose]);

  // Registra el teclado y restaura el foco
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return undefined;
    }

    returnFocusRef.current = document.activeElement;
    const bodyWasLocked = document.body.classList.contains('overflow-hidden');
    document.body.classList.add('overflow-hidden');

    // Mantiene el teclado dentro del diálogo
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (canCloseRef.current) {
          event.preventDefault();
          closeHandlerRef.current();
        }
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const focusIsOutside = !dialogRef.current.contains(
        document.activeElement
      );
      const focusIsOutsideFlow = focusIsOutside
        || !focusableElements.includes(document.activeElement);

      if (event.shiftKey && (
        document.activeElement === firstElement || focusIsOutsideFlow
      )) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && (
        document.activeElement === lastElement || focusIsOutsideFlow
      )) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Limpia eventos y devuelve el foco original
    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (!bodyWasLocked) {
        document.body.classList.remove('overflow-hidden');
      }

      const returnFocusElement = returnFocusRef.current;

      if (
        returnFocusElement
        && document.contains(returnFocusElement)
        && typeof returnFocusElement.focus === 'function'
      ) {
        returnFocusElement.focus();
      }
    };
  }, [isOpen]);

  // Enfoca el contenido inicial de cada vista
  useEffect(() => {
    if (!isOpen || !dialogRef.current || typeof window === 'undefined') {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      const initialElement = dialogRef.current?.querySelector(
        '[data-dialog-initial-focus]'
      );
      const fallbackElement = dialogRef.current
        ? getFocusableElements(dialogRef.current)[0]
        : null;
      (initialElement || fallbackElement || dialogRef.current)?.focus();
    });

    // Cancela el foco pendiente
    return () => window.cancelAnimationFrame(frameId);
  }, [focusKey, isOpen]);

  return dialogRef;
};
