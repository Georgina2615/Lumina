import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../../../config/firebase";
import { iniciarSesionGoogle, cerrarSesionApp, obtenerRolUsuario } from "../../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null); // Mi nuevo estado para guardar el rol actual
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    
    const desuscribir = onAuthStateChanged(auth, async (usuarioActual) => {
      if (usuarioActual) {
        try {
          // Si hay sesión de Google, voy a buscar su rol a mi servicio de Firestore
          const rolAsignado = await obtenerRolUsuario(usuarioActual.email);
          setUsuario(usuarioActual);
          setRol(rolAsignado); // Guardo mi rol en mi estado global
        } catch (error) {
          console.error("Error al mapear mi usuario con su rol:", error);
        }
      } else {
        // Si no hay nadie, limpio mis estados
        setUsuario(null);
        setRol(null);
      }
      setCargando(false);
    });
    
    return () => desuscribir();
  }, []);

  const valores = {
    usuario,
    rol, // Expongo mi rol para que mis pantallas puedan leerlo
    cargando,
    login: iniciarSesionGoogle,
    logout: cerrarSesionApp
  };

  return (
    <AuthContext.Provider value={valores}>
      {cargando ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Validando mis accesos y niveles de seguridad...</p>
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