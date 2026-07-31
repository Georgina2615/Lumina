import { useEffect, useState } from 'react';

// Mantiene una referencia temporal actualizada cada minuto
export const useMinuteClock = () => {
  // Conserva la hora local vigente
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    let intervalId;

    // Actualiza el reloj y comienza el intervalo estable
    const startClock = () => {
      setCurrentTime(new Date());
      intervalId = window.setInterval(() => {
        setCurrentTime(new Date());
      }, 60_000);
    };

    // Alinea la primera actualización al siguiente minuto
    const now = new Date();
    const delay = 60_000 - (
      now.getSeconds() * 1000 + now.getMilliseconds()
    );
    const timeoutId = window.setTimeout(startClock, delay);

    // Detiene los temporizadores vigentes
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  // Devuelve la hora local compartida
  return currentTime;
};
