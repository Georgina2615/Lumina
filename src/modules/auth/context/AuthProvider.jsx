import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { app } from '../../../config/firebase';
import {
  cerrarSesionApp,
  iniciarSesionGoogle,
  obtenerRolUsuario
} from '../services';
import { AuthContext } from './AuthContext';

// Provee la sesion y el rol confirmados
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isResolvingSession, setIsResolvingSession] = useState(true);
  const sessionVersion = useRef(0);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      const currentVersion = sessionVersion.current + 1;
      sessionVersion.current = currentVersion;
      setIsResolvingSession(true);

      try {
        const resolvedRole = currentUser
          ? await obtenerRolUsuario(currentUser.email)
          : null;

        if (sessionVersion.current !== currentVersion) return;
        setUser(currentUser);
        setRole(resolvedRole);
      } catch (error) {
        if (sessionVersion.current !== currentVersion) return;
        console.error('No se pudo validar la sesion del usuario', error);
        setUser(null);
        setRole(null);
      } finally {
        if (sessionVersion.current === currentVersion) {
          setIsResolvingSession(false);
          setIsInitializing(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async () => {
    setIsResolvingSession(true);
    try {
      return await iniciarSesionGoogle();
    } catch (error) {
      setIsResolvingSession(false);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setIsResolvingSession(true);
    try {
      await cerrarSesionApp();
    } catch (error) {
      setIsResolvingSession(false);
      throw error;
    }
  }, []);

  const value = useMemo(() => ({
    usuario: user,
    rol: role,
    cargando: isResolvingSession,
    login,
    logout
  }), [isResolvingSession, login, logout, role, user]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="animate-pulse font-body font-medium text-secondary">
          Comprobando acceso
        </p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
