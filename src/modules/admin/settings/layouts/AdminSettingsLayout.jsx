import { Outlet } from 'react-router-dom';

// Delimita las opciones de configuracion administrativa
export default function AdminSettingsLayout() {
  // Devuelve la pantalla elegida
  return (
    <div className="mx-auto w-full max-w-7xl pb-6">
      <Outlet />
    </div>
  );
}
