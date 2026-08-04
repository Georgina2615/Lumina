import { Outlet } from 'react-router-dom';
import AdminSettingsNavigation from '../components/AdminSettingsNavigation';

// Delimita las opciones de configuracion administrativa
export default function AdminSettingsLayout() {
  // Devuelve la pantalla elegida
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <AdminSettingsNavigation />
      <Outlet />
    </div>
  );
}
