import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  // Extraigo mi usuario directamente desde mi custom hook
  const { usuario } = useAuth();

  // Si no tengo un usuario activo, lo expulso al login
  if (!usuario) {
    return <Navigate to="/" />;
  }

  // Si pasó el filtro de seguridad, le muestro mi componente protegido
  return children;
}