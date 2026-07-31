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
    <div className="relative flex h-screen h-dvh w-full overflow-hidden bg-background font-body text-primary">
      <Sidebar
        usuario={user}
        menuPermitido={allowedMenu}
        onLogout={handleLogout}
      />

      <main className="h-full w-full flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-4 md:p-8">
        <Outlet />
      </main>

      <MobileTabBar
        allowedMenu={allowedMenu}
        onLogout={handleLogout}
      />
    </div>
  );
}
