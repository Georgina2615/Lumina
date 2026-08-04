import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAdminService,
  createServiceId,
  setAdminServiceActive,
  updateAdminService
} from '../services/AdminServiceCatalogCommandService';
import { loadAdminServices } from '../services/AdminServiceCatalogQueryService';
import {
  createServiceOperationId
} from '../services/AdminServiceCatalogPolicy';

// Controla la consulta y las operaciones del catalogo
export const useAdminServices = () => {
  const [services, setServices] = useState([]);
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [formService, setFormService] = useState(undefined);
  const [statusService, setStatusService] = useState(null);
  const requestIdRef = useRef(0);
  const pendingOperationRef = useRef(null);
  const mutationPromiseRef = useRef(null);

  // Conserva la identidad cuando se repite la misma solicitud
  const reserveOperation = useCallback(({ action, payload, serviceId }) => {
    const signature = JSON.stringify({ action, payload, serviceId });
    const pendingOperation = pendingOperationRef.current;

    if (pendingOperation?.signature === signature) {
      return pendingOperation;
    }

    const nextOperation = {
      operationId: createServiceOperationId(),
      serviceId: serviceId ?? createServiceId(),
      signature
    };

    pendingOperationRef.current = nextOperation;
    return nextOperation;
  }, []);

  // Carga el catalogo y descarta respuestas anteriores
  const refreshServices = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);
    setIsRefreshing(true);

    try {
      const nextServices = await loadAdminServices();

      if (requestId === requestIdRef.current) {
        setServices(nextServices);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError('No se pudieron cargar los servicios');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Ejecuta una escritura y actualiza la pantalla
  const runMutation = useCallback((operation, successMessage) => {
    if (mutationPromiseRef.current) {
      return mutationPromiseRef.current;
    }

    setIsMutating(true);
    setMutationError(null);

    const mutationPromise = (async () => {
      try {
        const result = await operation();
        await refreshServices();
        setFeedback({ message: successMessage });
        return result;
      } catch (operationError) {
        setMutationError(operationError.message);

        if ([
          'functions/aborted',
          'functions/not-found'
        ].includes(operationError.code)) {
          await refreshServices();
        }

        throw operationError;
      }
    })();

    mutationPromiseRef.current = mutationPromise;
    mutationPromise
      .finally(() => {
        if (mutationPromiseRef.current === mutationPromise) {
          mutationPromiseRef.current = null;
          setIsMutating(false);
        }
      })
      .catch(() => null);

    return mutationPromise;
  }, [refreshServices]);

  // Crea un servicio con una identidad reservada
  const createService = useCallback(async (command) => {
    const operation = reserveOperation({
      action: 'create',
      payload: command
    });
    const result = await runMutation(() => createAdminService({
      ...command,
      operationId: operation.operationId,
      serviceId: operation.serviceId
    }), 'Servicio creado. Está oculto en la agenda.');
    pendingOperationRef.current = null;
    setFormService(undefined);
    return result;
  }, [reserveOperation, runMutation]);

  // Actualiza los datos visibles de un servicio
  const updateService = useCallback(async (command) => {
    const currentService = formService;
    const payload = {
      ...command,
      expectedRevision: currentService.revision
    };
    const operation = reserveOperation({
      action: 'update',
      payload,
      serviceId: currentService.id
    });
    const result = await runMutation(() => updateAdminService({
      ...payload,
      operationId: operation.operationId,
      serviceId: operation.serviceId
    }), 'Cambios guardados correctamente');
    pendingOperationRef.current = null;
    setFormService(undefined);
    return result;
  }, [formService, reserveOperation, runMutation]);

  // Confirma el cambio de disponibilidad
  const confirmStatusChange = useCallback(async () => {
    const currentService = statusService;
    const nextActive = !currentService.active;
    const payload = {
      active: nextActive,
      expectedRevision: currentService.revision
    };
    const operation = reserveOperation({
      action: 'set_active',
      payload,
      serviceId: currentService.id
    });
    const result = await runMutation(() => setAdminServiceActive({
      ...payload,
      operationId: operation.operationId,
      serviceId: operation.serviceId
    }), nextActive ? 'Servicio visible en la agenda.' : 'Servicio oculto de la agenda.');
    pendingOperationRef.current = null;
    setStatusService(null);
    return result;
  }, [reserveOperation, runMutation, statusService]);

  // Realiza la primera lectura
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadAdminServices()
      .then((nextServices) => {
        if (requestId === requestIdRef.current) {
          setServices(nextServices);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError('No se pudieron cargar los servicios');
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
  }, []);

  // Expone estado y acciones de la pantalla
  return {
    clearMutationError: () => setMutationError(null),
    closeForm: () => !isMutating && setFormService(undefined),
    closeStatusDialog: () => !isMutating && setStatusService(null),
    confirmStatusChange,
    createService,
    error,
    feedback,
    formOpen: formService !== undefined,
    formService: formService ?? null,
    isLoading,
    isMutating,
    isRefreshing,
    mutationError,
    openCreateForm: () => {
      setFeedback(null);
      setMutationError(null);
      setFormService(null);
    },
    openEditForm: (service) => {
      setFeedback(null);
      setMutationError(null);
      setFormService(service);
    },
    openStatusDialog: (service) => {
      setFeedback(null);
      setMutationError(null);
      setStatusService(service);
    },
    refreshServices,
    services,
    setFeedback,
    statusService,
    updateService
  };
};
