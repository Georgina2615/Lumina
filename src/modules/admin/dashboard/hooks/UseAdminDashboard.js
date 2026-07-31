import { useCallback, useEffect, useRef, useState } from 'react';
import { loadAdminDashboard } from '../services/AdminDashboardService';

const emptySection = {
  data: null,
  error: null,
  isStale: false
};

const initialDashboard = {
  appointments: emptySection,
  dateKey: null,
  finances: emptySection,
  inventory: emptySection,
  loadedAt: null,
  sales: emptySection
};

// Conserva datos válidos cuando una actualización parcial falla
const mergeSection = (previousSection, nextSection) => {
  if (nextSection.data !== null) {
    return { ...nextSection, isStale: false };
  }

  if (previousSection.data !== null) {
    return {
      data: previousSection.data,
      error: nextSection.error,
      isStale: true
    };
  }

  return { ...nextSection, isStale: false };
};

// Combina una fotografía nueva con los datos todavía válidos
const mergeDashboard = (currentDashboard, nextDashboard) => {
  if (
    currentDashboard.dateKey
    && currentDashboard.dateKey !== nextDashboard.dateKey
  ) {
    return nextDashboard;
  }

  return {
    ...nextDashboard,
    appointments: mergeSection(
      currentDashboard.appointments,
      nextDashboard.appointments
    ),
    finances: mergeSection(
      currentDashboard.finances,
      nextDashboard.finances
    ),
    inventory: mergeSection(
      currentDashboard.inventory,
      nextDashboard.inventory
    ),
    loadedAt: nextDashboard.loadedAt ?? currentDashboard.loadedAt,
    sales: mergeSection(
      currentDashboard.sales,
      nextDashboard.sales
    )
  };
};

// Coordina la fotografía operativa del panel administrativo
export const useAdminDashboard = () => {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [fatalError, setFatalError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  // Ejecuta una lectura nueva sin crear escuchas permanentes
  const refreshDashboard = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setFatalError(null);

    if (hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextDashboard = await loadAdminDashboard();

      if (requestId !== requestIdRef.current) {
        return;
      }

      setDashboard((currentDashboard) => (
        mergeDashboard(currentDashboard, nextDashboard)
      ));
      hasLoadedRef.current = true;
    } catch {
      if (requestId === requestIdRef.current) {
        setFatalError('No se pudo actualizar el resumen administrativo');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadAdminDashboard()
      .then((nextDashboard) => {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setDashboard((currentDashboard) => (
          mergeDashboard(currentDashboard, nextDashboard)
        ));
        hasLoadedRef.current = true;
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setFatalError('No se pudo cargar el resumen administrativo');
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });

    // Invalida respuestas tardías al desmontar la pantalla
    return () => {
      requestIdRef.current += 1;
    };
  }, [refreshDashboard]);

  // Expone únicamente el estado necesario para la interfaz
  return {
    ...dashboard,
    fatalError,
    isLoading,
    isRefreshing,
    refreshDashboard
  };
};
