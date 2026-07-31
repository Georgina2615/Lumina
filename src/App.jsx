import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Conecta autenticación y autorización
import { AuthProvider, useAuth } from './modules/auth/context';
import { ProtectedRoute } from './modules/auth/components';

// Compone las estructuras globales
import { PublicLayout, DashboardLayout } from './app/layouts';

// Expone las capacidades públicas
import { LandingPage } from './modules/public/pages';

// Expone las capacidades de recepción
import { ReceptionDashboard, ReceptionCalendar, ReceptionClientDirectory, ReceptionPOS } from './modules/reception/pages';

// Expone las capacidades administrativas
import {
  AdminDashboard,
  AdminLayout,
  AdminRetailInventory
} from './modules/admin';

// Dirige cada rol hacia su área principal
const DashboardIndex = () => {
  const { rol: role } = useAuth();

  if (role === 'admin') {
    return <Navigate to="admin" replace />;
  }

  if (role === 'recepcion') {
    return <Navigate to="reception" replace />;
  }

  if (role === 'cosmetologa') {
    return <Navigate to="clinical" replace />;
  }

  return <div className="p-8 text-center text-error">Rol no autorizado</div>;
};

// Compone las rutas y proveedores de la aplicación
export default function App() {
  // Devuelve el árbol principal de navegación
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>

          <Route
            element={(
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            )}
            path="/dashboard"
          >
            <Route index element={<DashboardIndex />} />

            <Route element={<ProtectedRoute allowedRoles={['admin', 'recepcion']} />}>
              <Route path="reception" element={<ReceptionDashboard />} />
              <Route path="calendar" element={<ReceptionCalendar />} />
              <Route path="clientes" element={<ReceptionClientDirectory />} />
              <Route path="pos" element={<ReceptionPOS />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route
                  path="inventario-retail"
                  element={<AdminRetailInventory />}
                />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
