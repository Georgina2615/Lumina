import { Outlet } from 'react-router-dom';

// Delimita las capacidades protegidas de administración
export default function AdminLayout() {
  // Presenta la capacidad administrativa seleccionada
  return <Outlet />;
}
