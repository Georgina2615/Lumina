import { useEffect, useRef } from 'react';

// Define los controles que pueden recibir foco
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
  // Conserva el contenedor del diálogo
  const dialogRef = useRef(null);
  // Conserva el control que abrió el diálogo
  const returnFocusRef = useRef(null);
  // Conserva el cierre más reciente
  const closeHandlerRef = useRef(onRequestClose);
  // Conserva el permiso de cierre más reciente
  const canCloseRef = useRef(canClose);

  // Sincroniza las reglas usadas por el teclado
  useEffect(() => {
    closeHandlerRef.current = onRequestClose;
    canCloseRef.current = canClose;
  }, [canClose, onRequestClose]);

  // Registra el teclado y restaura el foco
  useEffect(() => {
    // Omite efectos cuando el diálogo está cerrado
    if (!isOpen || typeof document === 'undefined') {
      // Devuelve ausencia de limpieza
      return undefined;
    }
    returnFocusRef.current = document.activeElement;
    // Conserva el bloqueo previo de la página
    const bodyWasLocked = document.body.classList.contains('overflow-hidden');
    document.body.classList.add('overflow-hidden');

    // Mantiene el teclado dentro del diálogo
    const handleKeyDown = (event) => {
      // Procesa el cierre solicitado
      if (event.key === 'Escape') {
        // Respeta operaciones que no pueden cerrarse
        if (canCloseRef.current) {
          event.preventDefault();
          closeHandlerRef.current();
        }
        // Detiene otras reglas de teclado
        return;
      }
      // Omite teclas distintas a tabulación
      if (event.key !== 'Tab' || !dialogRef.current) {
        // Detiene la lógica de tabulación
        return;
      }
      // Obtiene los controles vigentes
      const focusableElements = getFocusableElements(dialogRef.current);
      // Mantiene foco en el diálogo vacío
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        // Detiene el recorrido vacío
        return;
      }
      // Obtiene extremos del recorrido
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      // Detecta foco fuera del diálogo
      const focusIsOutside = !dialogRef.current.contains(
        document.activeElement
      );
      // Detecta foco fuera del recorrido natural
      const focusIsOutsideFlow = focusIsOutside
        || !focusableElements.includes(document.activeElement);
      // Envuelve el recorrido hacia atrás
      if (event.shiftKey && (
        document.activeElement === firstElement || focusIsOutsideFlow
      )) {
        event.preventDefault();
        lastElement.focus();
        // Detiene el recorrido procesado
        return;
      }
      // Envuelve el recorrido hacia adelante
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
      // Restaura el desplazamiento previo
      if (!bodyWasLocked) {
        document.body.classList.remove('overflow-hidden');
      }
      // Obtiene el control original
      const returnFocusElement = returnFocusRef.current;
      // Restaura solo controles todavía disponibles
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
    // Omite foco cuando el diálogo está cerrado
    if (
      !isOpen
      || !dialogRef.current
      || typeof window === 'undefined'
    ) {
      // Devuelve ausencia de limpieza
      return undefined;
    }
    // Programa el foco después del render
    const frameId = window.requestAnimationFrame(() => {
      // Obtiene el foco preferido
      const initialElement = dialogRef.current?.querySelector(
        '[data-dialog-initial-focus]'
      );
      // Obtiene el primer control como respaldo
      const fallbackElement = dialogRef.current
        ? getFocusableElements(dialogRef.current)[0]
        : null;
      (initialElement || fallbackElement || dialogRef.current)?.focus();
    });
    // Cancela el foco pendiente
    return () => window.cancelAnimationFrame(frameId);
  }, [focusKey, isOpen]);

  // Devuelve la referencia visual
  return dialogRef;
};
