import { useEffect, useRef, useState } from 'react';

// Controla la aparicion accesible de un elemento
export function useScrollReveal({ once = true } = {}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Muestra el contenido cuando no requiere observacion
    if (!element || prefersReducedMotion || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Actualiza la visibilidad cuando entra en pantalla
        if (entry.isIntersecting) {
          setIsVisible(true);

          // Deja de observar despues de la primera aparicion
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.12
      }
    );

    observer.observe(element);

    // Elimina el observador al desmontar
    return () => observer.disconnect();
  }, [once]);

  // Devuelve la referencia y el estado visual
  return { elementRef, isVisible };
}
