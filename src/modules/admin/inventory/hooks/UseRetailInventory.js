import { useCallback, useEffect, useRef, useState } from 'react';
import {
  adjustRetailProductStock,
  createRetailProduct,
  createRetailProductId,
  setRetailProductActive,
  updateRetailProduct
} from '../services/RetailInventoryCommandService';
import { createOperationId } from '../services/RetailInventoryPolicy';
import { loadRetailInventory } from '../services/RetailInventoryQueryService';
import { uploadRetailProductImage } from '../services/RetailProductImageService';

const initialInventory = {
  costsUnavailable: false,
  products: []
};

// Coordina lecturas manuales y operaciones administrativas
export const useRetailInventory = () => {
  const [inventory, setInventory] = useState(initialInventory);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState(null);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

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
      const nextInventory = await loadRetailInventory();

      if (requestId === requestIdRef.current) {
        setInventory(nextInventory);
        hasLoadedRef.current = true;
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError('No se pudo cargar el inventario retail');
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

  // Crea el producto y trata la imagen como paso recuperable
  const createProduct = useCallback(({ command, imageFile }) => (
    runMutation(async () => {
      const productId = createRetailProductId();
      const result = await createRetailProduct({
        ...command,
        operationId: createOperationId(),
        productId
      });
      let imageWarning = null;

      if (imageFile) {
        try {
          await uploadRetailProductImage({
            expectedRevision: result.revision,
            file: imageFile,
            operationId: createOperationId(),
            productId
          });
        } catch {
          imageWarning = 'El producto se creó pero la imagen necesita reintentarse';
        }
      }

      return { imageWarning, result };
    })
  ), [runMutation]);

  // Actualiza datos comerciales y permite reemplazar la imagen
  const updateProduct = useCallback(({ command, imageFile, product }) => (
    runMutation(async () => {
      const result = await updateRetailProduct({
        ...command,
        expectedRevision: product.revision,
        operationId: createOperationId(),
        productId: product.id
      });
      let imageWarning = null;

      if (imageFile) {
        try {
          await uploadRetailProductImage({
            expectedRevision: result.revision,
            file: imageFile,
            operationId: createOperationId(),
            productId: product.id
          });
        } catch {
          imageWarning = 'Los datos se guardaron pero la imagen necesita reintentarse';
        }
      }

      return { imageWarning, result };
    })
  ), [runMutation]);

  // Registra un movimiento de existencias auditado
  const adjustStock = useCallback(({ command, product }) => (
    runMutation(() => adjustRetailProductStock({
      ...command,
      expectedRevision: product.revision,
      operationId: createOperationId(),
      productId: product.id
    }))
  ), [runMutation]);

  // Cambia el estado comercial sin eliminar historial
  const setProductActive = useCallback((product, active) => (
    runMutation(() => setRetailProductActive({
      active,
      expectedRevision: product.revision,
      operationId: createOperationId(),
      productId: product.id
    }))
  ), [runMutation]);

  // Realiza la primera lectura y descarta respuestas tardías
  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadRetailInventory()
      .then((nextInventory) => {
        if (requestId === requestIdRef.current) {
          setInventory(nextInventory);
          hasLoadedRef.current = true;
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError('No se pudo cargar el inventario retail');
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

  // Expone únicamente acciones y estado de la pantalla
  return {
    ...inventory,
    adjustStock,
    clearMutationError: () => setMutationError(null),
    createProduct,
    error,
    isLoading,
    isMutating,
    isRefreshing,
    mutationError,
    refreshInventory,
    setProductActive,
    updateProduct
  };
};
