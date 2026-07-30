import {
  useEffect,
  useState
} from 'react';

// Mantiene un reloj ligero durante el enfriamiento
export const useTicketClock = (deadlineMillis) => {
  // Conserva la hora usada por la política
  const [nowMillis, setNowMillis] = useState(() => Date.now());

  // Actualiza solo mientras existe una espera visible
  useEffect(() => {
    // Omite intervalos fuera del navegador
    if (typeof window === 'undefined') {
      // Devuelve ausencia de limpieza
      return undefined;
    }

    // Sincroniza la hora cuando cambia la fecha límite
    const initialTimeoutId = window.setTimeout(() => {
      setNowMillis(Date.now());
    }, 0);

    // Omite intervalos sin una fecha futura
    if (
      !Number.isFinite(deadlineMillis)
      || deadlineMillis <= Date.now()
    ) {
      // Devuelve la limpieza inicial
      return () => window.clearTimeout(initialTimeoutId);
    }

    // Actualiza la cuenta regresiva
    const intervalId = window.setInterval(() => {
      // Obtiene la hora vigente
      const nextNowMillis = Date.now();
      setNowMillis(nextNowMillis);

      // Detiene el reloj al finalizar la espera
      if (nextNowMillis >= deadlineMillis) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    // Libera el intervalo vigente
    return () => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, [deadlineMillis]);

  // Devuelve la hora compartida
  return nowMillis;
};
