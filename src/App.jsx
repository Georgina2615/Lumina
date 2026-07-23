import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Módulo Auth
import { AuthProvider, useAuth } from './modules/auth/context';
import { ProtectedRoute } from './modules/auth/components'; // <-- Importación limpia

// Layouts 
import { PublicLayout, DashboardLayout } from './modules/common/layouts';

// Vistas Públicas
import LandingPage from './modules/public/pages/LandingPage';

// Vistas Privadas Recepción
import { ReceptionDashboard, ReceptionCalendar, ReceptionClientDirectory } from './modules/reception/pages';

const DashboardIndex = () => {
  const { rol } = useAuth(); 
  if (rol === 'recepcion' || rol === 'admin') return <Navigate to="reception" replace />;
  if (rol === 'cosmetologa') return <Navigate to="clinical" replace />;
  return <div className="p-8 text-center text-error">Rol no autorizado</div>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          
          {/* MÓDULO PÚBLICO */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
          </Route>
          
          {/* MÓDULO PRIVADO (Dashboard) */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<DashboardIndex />} />
            
            {/* GRUPO DE RECEPCIÓN (Se valida el rol 1 sola vez para todas estas rutas) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'recepcion']} />}>
              <Route path="reception" element={<ReceptionDashboard />} />
              <Route path="calendar" element={<ReceptionCalendar />} />
              <Route path="clientes" element={<ReceptionClientDirectory />} />
              <Route path="pos" element={<div className="p-8 text-center"><h2 className="text-3xl font-title text-primary">Punto de Venta</h2></div>} />
            </Route>

            {/* GRUPO DE CLÍNICA (Futuro) */}
            {/* <Route element={<ProtectedRoute allowedRoles={['admin', 'cosmetologa']} />}>
                  <Route path="clinical" element={<ClinicalDashboard />} />
                </Route> */}
            
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}