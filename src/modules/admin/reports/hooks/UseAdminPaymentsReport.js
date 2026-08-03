import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { loadAdminPaymentsReport } from '../services/AdminReportQueryService';
import {
  getAdminReportPeriod,
  REPORT_PERIOD_KEYS
} from '../services/AdminReportPeriodService';

const createEmptyReport = () => ({
  depositCents: 0,
  finalPaymentCents: 0,
  methodTotals: {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
  },
  payments: [],
  salesCount: 0,
  totalReceivedCents: 0,
  warningCount: 0
});

// Traduce fallos técnicos a mensajes comprensibles
const getReportErrorMessage = (error) => {
  if (error?.code === 'permission-denied') {
    return 'No tienes permisos para consultar los cobros';
  }

  if (error?.code === 'unavailable') {
    return 'No hay conexión para actualizar los cobros';
  }

  if (error?.code === 'failed-precondition') {
    return 'La consulta necesita una configuración adicional';
  }

  return 'No se pudieron cargar los cobros y ventas';
};

// Coordina el reporte financiero seleccionado
export const useAdminPaymentsReport = () => {
  const [periodKey, setSelectedPeriodKey] = useState(
    REPORT_PERIOD_KEYS.today
  );
  const [report, setReport] = useState(createEmptyReport);
  const [error, setError] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);
  const period = useMemo(
    () => getAdminReportPeriod(periodKey),
    [periodKey]
  );

  // Actualiza el periodo visible y descarta respuestas tardías
  const refreshReport = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);
    setIsRefreshing(true);

    try {
      const nextReport = await loadAdminPaymentsReport(periodKey);

      if (requestId === requestIdRef.current) {
        setReport(nextReport);
        setHasLoaded(true);
      }
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(getReportErrorMessage(loadError));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [periodKey]);

  // Cambia de periodo sin conservar importes anteriores
  const setPeriodKey = useCallback((nextPeriodKey) => {
    if (nextPeriodKey === periodKey) {
      return;
    }

    setReport(createEmptyReport());
    setError(null);
    setHasLoaded(false);
    setIsLoading(true);
    setSelectedPeriodKey(nextPeriodKey);
  }, [periodKey]);

  // Carga la fotografía cuando cambia el periodo
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadAdminPaymentsReport(periodKey)
      .then((nextReport) => {
        if (requestId === requestIdRef.current) {
          setReport(nextReport);
          setHasLoaded(true);
        }
      })
      .catch((loadError) => {
        if (requestId === requestIdRef.current) {
          setError(getReportErrorMessage(loadError));
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });

    return () => {
      requestIdRef.current += 1;
    };
  }, [periodKey]);

  // Expone únicamente el estado necesario para la interfaz
  return {
    error,
    hasLoaded,
    isLoading,
    isRefreshing,
    period,
    periodKey,
    refreshReport,
    report,
    setPeriodKey
  };
};
