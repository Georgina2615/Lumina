import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context';

export const useLogin = () => {
  const [connectionError, setConnectionError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWaitingForSession, setIsWaitingForSession] = useState(false);
  const {
    usuario: user,
    rol: role,
    cargando: isResolvingSession,
    login
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isWaitingForSession || isResolvingSession) return;

    if (user && role) {
      navigate('/dashboard', { replace: true });
    }
  }, [isResolvingSession, isWaitingForSession, navigate, role, user]);

  const hasAccessError = isWaitingForSession
    && !isResolvingSession
    && (!user || !role);
  const errorLocal = connectionError
    || (hasAccessError ? 'Esta cuenta no tiene acceso al sistema' : '');
  const isSubmitting = isConnecting
    || (isWaitingForSession && isResolvingSession);

  const manejarIngresoGoogle = async () => {
    if (isSubmitting) return;
    setConnectionError('');
    setIsWaitingForSession(false);
    setIsConnecting(true);

    try {
      await login();
      setIsWaitingForSession(true);
    } catch (error) {
      console.error('No se pudo iniciar sesion con Google', error);
      setConnectionError('No pudimos conectar con Google Intenta nuevamente');
    } finally {
      setIsConnecting(false);
    }
  };

  return { errorLocal, isSubmitting, manejarIngresoGoogle };
};
