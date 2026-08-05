import { Outlet } from 'react-router-dom';
import AdminReportsNavigation from '../components/AdminReportsNavigation';

// Agrupa las pantallas de dinero de administracion
export default function AdminReportsLayout() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      <AdminReportsNavigation />
      <Outlet />
    </div>
  );
}
