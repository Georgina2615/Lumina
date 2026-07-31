import { Outlet } from 'react-router-dom';

import { menuItems } from '../../config/navigation';

import { useAuth } from '../../modules/auth/context';
import { useLogout } from '../../modules/auth/hooks';

import { Sidebar, MobileTabBar } from '../components';

// Compone la experiencia privada de la aplicación
export default function DashboardLayout() {
  const { usuario: user, rol: role } = useAuth();
  const { manejarCierreSesion: handleLogout } = useLogout();

  // Filtra la navegación según el rol vigente
  const allowedMenu = menuItems.filter((item) => item.roles.includes(role));

  // Presenta la navegación y el contenido protegido
  return (
    <div className="h-screen w-full flex bg-background text-primary font-body overflow-hidden relative">
      <Sidebar
        usuario={user}
        menuPermitido={allowedMenu}
        onLogout={handleLogout}
      />

      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 pb-24 w-full">
        <Outlet />
      </main>

      <MobileTabBar
        allowedMenu={allowedMenu}
        onLogout={handleLogout}
      />
    </div>
  );
}
