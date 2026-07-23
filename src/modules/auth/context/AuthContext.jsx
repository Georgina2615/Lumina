import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { app } from '../../../config/firebase'; 
import { iniciarSesionGoogle, obtenerRolUsuario, cerrarSesionApp } from '../services';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null); 
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    
    // Detectar cambios en el estado de la sesión
    const desuscribir = onAuthStateChanged(auth, async (usuarioActual) => {
      if (usuarioActual) {
        try {
          const rolAsignado = await obtenerRolUsuario(usuarioActual.email);
          setUsuario(usuarioActual);
          setRol(rolAsignado);
        } catch (error) {
          console.error("Fallo al mapear usuario con roles de sistema:", error);
        }
      } else {
        setUsuario(null);
        setRol(null);
      }
      setCargando(false);
    });
    
    return () => desuscribir();
  }, []);

  const valores = {
    usuario,
    rol, 
    cargando,
    login: iniciarSesionGoogle,
    logout: cerrarSesionApp
  };

  return (
    <AuthContext.Provider value={valores}>
      {cargando ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <p className="text-secondary font-body font-medium animate-pulse">
            Validando accesos y protocolos de seguridad...
          </p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};