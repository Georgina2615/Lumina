import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} from '../services/AdminUsersCommandService';
import { loadAdminUsers } from '../services/AdminUsersQueryService';

export const useAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [formUser, setFormUser] = useState(undefined);
  const requestIdRef = useRef(0);
  const mutationPromiseRef = useRef(null);

  const refreshUsers = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setError(null);
    setIsLoading(true);

    try {
      const nextUsers = await loadAdminUsers();

      if (requestId === requestIdRef.current) {
        setUsers(nextUsers);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError('No se pudieron cargar las cuentas');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const runMutation = useCallback((operation, successMessage) => {
    if (mutationPromiseRef.current) {
      return mutationPromiseRef.current;
    }

    setIsMutating(true);
    setMutationError(null);

    const mutationPromise = (async () => {
      try {
        const result = await operation();
        await refreshUsers();
        setFeedback({ message: successMessage });
        return result;
      } catch (operationError) {
        setMutationError(operationError.message || 'No se pudo guardar la cuenta');
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
  }, [refreshUsers]);

  const createUser = useCallback(async (command) => {
    if (formUser?.id) {
      const result = await runMutation(
        () => updateAdminUser(formUser.id, command),
        'Cuenta actualizada correctamente'
      );
      setFormUser(undefined);
      return result;
    }

    const result = await runMutation(
      () => createAdminUser(command),
      'Cuenta creada correctamente'
    );
    setFormUser(undefined);
    return result;
  }, [formUser, runMutation]);

  const toggleActive = useCallback(async (user) => {
    const payload = { activo: !user.active };
    const result = await runMutation(() => updateAdminUser(user.id, payload),
      user.active ? 'Cuenta desactivada' : 'Cuenta activada');


    // Además intenta sincronizar el estado con el acceso del usuario (si existe)
    try {
      await import('../services/AdminUsersCommandService.js').then((svc) => svc.manageAuthUser({ uid: user.id, action: user.active ? 'disable' : 'enable' }));
    } catch (e) {
      // No bloquear la operación principal por fallos en la sincronización
      console.warn('No se pudo sincronizar el estado de acceso', e);
    }

    return result;
  }, [runMutation]);

  const deleteUser = useCallback(async (user) => {
    const result = await runMutation(() => deleteAdminUser(user.id), 'Cuenta eliminada');

    // Además intenta eliminar el acceso del usuario en el sistema
    try {
      await import('../services/AdminUsersCommandService.js').then((svc) => svc.manageAuthUser({ uid: user.id, action: 'delete' }));
    } catch (e) {
      console.warn('No se pudo eliminar el acceso del usuario en el sistema', e);
    }

    return result;
  }, [runMutation]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    loadAdminUsers()
      .then((nextUsers) => {
        if (requestId === requestIdRef.current) {
          setUsers(nextUsers);
        }
      })
      .catch(() => {
        if (requestId === requestIdRef.current) {
          setError('No se pudieron cargar las cuentas');
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

  return {
    clearMutationError: () => setMutationError(null),
    closeForm: () => !isMutating && setFormUser(undefined),
    createUser,
    error,
    feedback,
    formOpen: formUser !== undefined,
    formUser: formUser ?? null,
    isLoading,
    isMutating,
    mutationError,
    openCreateForm: () => {
      setFeedback(null);
      setMutationError(null);
      setFormUser(null);
    },
    openEditForm: (user) => {
      setFeedback(null);
      setMutationError(null);
      setFormUser(user);
    },
    toggleActive,
    deleteUser,
    refreshUsers,
    setFeedback,
    users
  };
};
