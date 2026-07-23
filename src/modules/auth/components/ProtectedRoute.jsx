import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context'; 

export default function ProtectedRoute({ children, allowedRoles }) {
  const { usuario, rol, cargando } = useAuth();

  if (cargando) {
    return <div className="p-8 text-center font-body text-muted">Cargando sesión...</div>;
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}