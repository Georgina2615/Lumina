import { Navigate } from 'react-router-dom';
import { useAuth } from '../context'; 

export default function ProtectedRoute({ children, allowedRoles }) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-secondary font-body animate-pulse">
          Validando niveles de seguridad...
        </p>
      </div>
    );
  }

  // Si no hay sesión activa, va para afuera 
  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(rol)) {
    // Lo redirigimos a su área base correspondiente dentro del Layout
    if (rol === 'admin') return <Navigate to="/dashboard/admin" replace />;
    if (rol === 'recepcion') return <Navigate to="/dashboard/reception" replace />;
    if (rol === 'cosmetologa') return <Navigate to="/dashboard/clinical" replace />;
    
    return <Navigate to="/" replace />; 
  }
  return children;
}