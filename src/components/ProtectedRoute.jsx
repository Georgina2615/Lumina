import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { app } from '../config/firebase';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, (usuarioActual) => {
      setUser(usuarioActual);
      setCargando(false); 
    });
    
    return () => desuscribir();
  }, [auth]);

  if (cargando) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Cargando seguridad...</div>;

  // Regreso a la pantalla de Login
  if (!user) return <Navigate to="/" />;

  return children;
}