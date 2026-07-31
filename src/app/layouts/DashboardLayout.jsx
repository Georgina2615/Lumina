import { Outlet, useLocation } from 'react-router-dom';

import { getWorkspaceMenu } from '../../config/WorkspaceNavigation';

import { useAuth } from '../../modules/auth/context';
import { useLogout } from '../../modules/auth/hooks';

import { Sidebar, MobileTabBar } from '../components';

// Compone la experiencia privada de la aplicación
export default function DashboardLayout() {
  const { usuario: user, rol: role } = useAuth();
  const { manejarCierreSesion: handleLogout } = useLogout();
  const location = useLocation();

  // Resuelve la navegación según el rol y el espacio vigente
  const allowedMenu = getWorkspaceMenu({
    pathname: location.pathname,
    role
  });

  // Presenta la navegación y el contenido protegido
  return (
    <div className="relative flex h-screen h-dvh w-full overflow-hidden bg-background font-body text-primary">
      <Sidebar
        allowedMenu={allowedMenu}
        onLogout={handleLogout}
        user={user}
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
