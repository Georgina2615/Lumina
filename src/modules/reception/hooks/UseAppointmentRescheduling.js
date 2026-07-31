import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  getAvailableReschedulingCredits
} from '../services/AppointmentReschedulingService';

// Controla créditos disponibles sin repetir consultas
export const useAppointmentRescheduling = (clientId) => {
  const [credits, setCredits] = useState([]);
  const [creditChoice, setCreditChoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadedClientId, setLoadedClientId] = useState(null);
  const [requestClientId, setRequestClientId] = useState(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef({
    clientId: null,
    promise: null,
    result: null
  });

  // Consulta o reutiliza los créditos del cliente
  const loadCredits = useCallback(async (
    requestedClientId,
    force = false
  ) => {
    setRequestClientId(requestedClientId);

    // Reutiliza una consulta terminada
    if (
      !force
      && cacheRef.current.clientId === requestedClientId
      && cacheRef.current.result
    ) {
      return cacheRef.current.result;
    }

    // Reutiliza una consulta en curso
    if (
      !force
      && cacheRef.current.clientId === requestedClientId
      && cacheRef.current.promise
    ) {
      return cacheRef.current.promise;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);
    setLoadedClientId(null);
    setCreditChoice(null);

    // Conserva la promesa para evitar lecturas duplicadas
    const promise = getAvailableReschedulingCredits(requestedClientId);
    cacheRef.current = {
      clientId: requestedClientId,
      promise,
      result: null
    };

    try {
      const result = await promise;

      if (requestIdRef.current === requestId) {
        cacheRef.current = {
          clientId: requestedClientId,
          promise: null,
          result
        };
        setCredits(result);
        setLoadedClientId(requestedClientId);
        setLoading(false);
      }

      return result;
    } catch (loadError) {
      if (requestIdRef.current === requestId) {
        cacheRef.current = {
          clientId: requestedClientId,
          promise: null,
          result: null
        };
        setCredits([]);
        setLoadedClientId(null);
        setError(loadError.message);
        setLoading(false);
      }

      throw loadError;
    }
  }, []);

  // Sincroniza el cliente reconocido
  useEffect(() => {
    if (!clientId) {
      return undefined;
    }

    let active = true;

    // Inicia la consulta después de sincronizar el render
    void Promise.resolve().then(() => {
      if (active) {
        return loadCredits(clientId);
      }
      return null;
    }).catch(() => {});

    // Evita iniciar consultas de un cliente anterior
    return () => {
      active = false;
    };
  }, [clientId, loadCredits]);

  // Obtiene el crédito seleccionado
  const hasCurrentRequest = requestClientId === clientId;
  const hasLoadedCurrentClient = hasCurrentRequest
    && loadedClientId === clientId;
  const activeCredits = useMemo(
    () => (hasLoadedCurrentClient ? credits : []),
    [credits, hasLoadedCurrentClient]
  );
  const activeCreditChoice = hasLoadedCurrentClient
    ? creditChoice
    : null;
  const selectedCredit = useMemo(() => (
    activeCredits.find(
      (credit) => credit.sourceAppointmentId === creditChoice
    ) ?? null
  ), [activeCredits, creditChoice]);

  // Reintenta una consulta fallida
  const retry = useCallback(() => {
    if (clientId) {
      void loadCredits(clientId, true).catch(() => {});
    }
  }, [clientId, loadCredits]);

  // Limpia únicamente la decisión del operador
  const clearSelection = useCallback(() => {
    setCreditChoice(null);
  }, []);

  // Devuelve el estado de selección
  return {
    credits: activeCredits,
    creditChoice: activeCreditChoice,
    selectedCredit,
    loading: hasCurrentRequest && loading,
    error: hasCurrentRequest ? error : null,
    loadedClientId,
    ready: hasLoadedCurrentClient,
    decisionPending: activeCredits.length > 0
      && activeCreditChoice === null,
    onCreditChoiceChange: setCreditChoice,
    clearSelection,
    ensureCredits: loadCredits,
    retry
  };
};
