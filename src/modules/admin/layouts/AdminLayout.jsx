import { Outlet } from 'react-router-dom';
import AdminSectionNavigation from '../components/AdminSectionNavigation';

// Delimita las capacidades protegidas de administración
export default function AdminLayout() {
  // Presenta la capacidad administrativa seleccionada
  return (
    <div className="min-h-full w-full">
      <AdminSectionNavigation />
      <Outlet />
    </div>
  );
}
