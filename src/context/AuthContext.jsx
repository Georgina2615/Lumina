import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../config/firebase";
import { iniciarSesionGoogle, cerrarSesionApp } from "../services/authService";

// Creo mi contexto para compartir mi estado globalmente
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Defino mis estados para el usuario y el tiempo de validación
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    // Me suscribo a los cambios de sesión de mi app
    const desuscribir = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
    });
    
    // Limpio mi suscripción cuando el componente se desmonta para evitar fugas de memoria
    return () => desuscribir();
  }, []);

  // Agrupo mis funciones e información para enviarlas a mis vistas
  const valores = {
    usuario,
    cargando,
    login: iniciarSesionGoogle,
    logout: cerrarSesionApp
  };

  return (
    <AuthContext.Provider value={valores}>
      {/* Si estoy cargando la seguridad, muestro una pantalla de espera; si no, cargo mis componentes */}
      {cargando ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Validando mis credenciales...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Creo mi propio hook personalizado para consumir mi contexto fácilmente en cualquier archivo
export const useAuth = () => {
  return useContext(AuthContext);
};