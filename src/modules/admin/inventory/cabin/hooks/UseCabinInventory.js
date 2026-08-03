import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adjustCabinSupplyStock,
  createCabinSupply,
  createCabinSupplyId,
  setCabinSupplyActive,
  updateCabinSupply
} from '../services/CabinInventoryCommandService';
import { createCabinOperationId } from '../services/CabinInventoryPolicy';
import { loadCabinInventory } from '../services/CabinInventoryQueryService';

const initialInventory = {
  costsUnavailable: false,
  supplies: []
};

// Coordina lecturas manuales y operaciones administrativas
export const useCabinInventory = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const pendingOperationsRef = useRef(new Map());

  // Conserva identificadores cuando una respuesta resulta ambigua
  const runIdempotentOperation = useCallback(async ({
    action,
    createPayload,
    key
  }) => {
    const pendingPayload = pendingOperationsRef.current.get(key)
      ?? createPayload();
    pendingOperationsRef.current.set(key, pendingPayload);

    const result = await action(pendingPayload);
    pendingOperationsRef.current.delete(key);
    return result;
  }, []);

  // Carga una fotografía nueva sin escuchas permanentes
  const refreshInventory = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);

    if (hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const nextInventory = await loadCabinInventory();

      if (requestId === requestIdRef.current) {
        setInventory(nextInventory);
        hasLoadedRef.current = true;
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError('No se pudo cargar el inventario de cabina');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Ejecuta una mutación y actualiza la fotografía visible
  const runMutation = useCallback(async (action) => {
    setIsMutating(true);
    setMutationError(null);

    try {
      const result = await action();
      await refreshInventory();
      return result;
    } catch (actionError) {
      const message = actionError?.message
        || 'No se pudo completar la operación';
      setMutationError(message);
      throw actionError;
    } finally {
      setIsMutating(false);
    }
  }, [refreshInventory]);

  // Crea un insumo con valores iniciales auditables
  const createSupply = useCallback((command) => runMutation(() => (
    runIdempotentOperation({
      action: createCabinSupply,
      createPayload: () => ({
        ...command,
        operationId: createCabinOperationId(),
        supplyId: createCabinSupplyId()
      }),
      key: `create:${JSON.stringify(command)}`
    })
  )), [runIdempotentOperation, runMutation]);

  // Actualiza metadatos sin alterar existencias
  const updateSupply = useCallback(({ command, supply }) => runMutation(() => (
    runIdempotentOperation({
      action: updateCabinSupply,
      createPayload: () => ({
        ...command,
        expectedRevision: supply.revision,
        operationId: createCabinOperationId(),
        supplyId: supply.id
      }),
      key: `update:${supply.id}:${supply.revision}:${JSON.stringify(command)}`
    })
  )), [runIdempotentOperation, runMutation]);

  // Registra un movimiento auditable
  const adjustStock = useCallback(({ command, supply }) => runMutation(() => (
    runIdempotentOperation({
      action: adjustCabinSupplyStock,
      createPayload: () => ({
        ...command,
        expectedRevision: supply.revision,
        operationId: createCabinOperationId(),
        supplyId: supply.id
      }),
      key: `stock:${supply.id}:${supply.revision}:${JSON.stringify(command)}`
    })
  )), [runIdempotentOperation, runMutation]);

  // Cambia el estado sin borrar historial
  const setSupplyActive = useCallback((supply, active) => runMutation(() => (
    runIdempotentOperation({
      action: setCabinSupplyActive,
      createPayload: () => ({
        active,
        expectedRevision: supply.revision,
        operationId: createCabinOperationId(),
        supplyId: supply.id
      }),
      key: `state:${supply.id}:${supply.revision}:${active}`
    })
  )), [runIdempotentOperation, runMutation]);

  // Realiza la primera lectura y descarta respuestas tardías
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadCabinInventory()
      .then((nextInventory) => {
        if (requestId === requestIdRef.current) {
          setInventory(nextInventory);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError('No se pudo cargar el inventario de cabina');
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

  // Expone acciones y estado de la pantalla
  return {
    ...inventory,
    adjustStock,
    clearMutationError: () => setMutationError(null),
    createSupply,
    error,
    isLoading,
    isMutating,
    isRefreshing,
    mutationError,
    refreshInventory,
    setSupplyActive,
    updateSupply
  };
};
