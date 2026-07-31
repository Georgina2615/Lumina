import { Outlet } from 'react-router-dom';

// Delimita las capacidades protegidas de administración
export default function AdminLayout() {
  // Presenta la capacidad administrativa seleccionada
  return (
    <div className="min-h-full w-full">
      <Outlet />
    </div>
  );
}
