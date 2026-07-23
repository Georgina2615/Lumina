import { Outlet } from 'react-router-dom';

// Configuración Global
import { menuItems } from '../../../config/navigation';

// Módulo Auth (Seguridad)
import { useAuth } from '../../auth/context';
import { useLogout } from '../../auth/hooks';

// Módulo Common (Herramientas visuales)
import { Sidebar, MobileTabBar } from '../components';
export default function DashboardLayout() {
  const { usuario, rol } = useAuth();
  const { manejarCierreSesion } = useLogout();

  // Filtramos el menú según el rol
  const menuPermitido = menuItems.filter(item => item.roles.includes(rol));
   return (
    <div className="h-screen w-full flex bg-background text-primary font-body overflow-hidden relative">
      
      {/* SIDEBAR DESKTOP */}
      <Sidebar 
        usuario={usuario} 
        menuPermitido={menuPermitido} 
        onLogout={manejarCierreSesion} 
      />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 pb-24 w-full">
        <Outlet />
      </main>

      {/* BOTTOM TAB BAR MÓVIL  */}
      <MobileTabBar 
        menuPermitido={menuPermitido} 
        onLogout={manejarCierreSesion} 
      />

    </div>
  );
}