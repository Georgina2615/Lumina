import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/context';
import { loadClientAccount } from '../services/ClientAccountService';
import { groupClientAppointments } from '../services/ClientAccountPolicy';

// Coordina el acceso y las citas de la clienta
export const useClientAccount = () => {
  const {
    usuario: user,
    cargando: sessionLoading,
    login,
    logout
  } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      setAccount(await loadClientAccount());
    } catch (requestError) {
      setAccount(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (sessionLoading || !user) return;
    let isActive = true;
    loadClientAccount()
      .then((result) => {
        if (!isActive) return;
        setAccount(result);
        setError('');
      })
      .catch((requestError) => {
        if (!isActive) return;
        setAccount(null);
        setError(requestError.message);
      });
    return () => {
      isActive = false;
    };
  }, [sessionLoading, user]);

  const connect = useCallback(async () => {
    if (connecting) return;
    setConnecting(true);
    setError('');
    try {
      await login();
    } catch (loginError) {
      console.error('No se pudo abrir la cuenta de la clienta', loginError);
      setError('No pudimos conectar con Google');
    } finally {
      setConnecting(false);
    }
  }, [connecting, login]);

  const disconnect = useCallback(async () => {
    setError('');
    await logout();
    setAccount(null);
  }, [logout]);

  const visibleAccount = account?.client?.email === user?.email?.toLowerCase()
    ? account
    : null;
  const appointments = useMemo(() => groupClientAppointments(
    visibleAccount?.appointments ?? []
  ), [visibleAccount]);

  return {
    account: visibleAccount,
    appointments,
    connect,
    connecting,
    disconnect,
    error,
    loading: loading || sessionLoading
      || Boolean(user && !visibleAccount && !error),
    refresh,
    user
  };
};
