import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/auth/context/AuthContext';
import ProtectedRoute from './modules/auth/components/ProtectedRoute';

// Layouts 
import PublicLayout from './modules/common/layouts/PublicLayout';
import DashboardLayout from './modules/common/layouts/DashboardLayout';

// Vistas Públicas
import LandingPage from './modules/public/pages/LandingPage';

// Vistas Privadas Recepción
import ReceptionDashboard from './modules/reception/pages/ReceptionDashboard';
import ReceptionCalendar from './modules/reception/pages/ReceptionCalendar';

// Temporal para las rutas en construcción
const Placeholder = ({ title }) => (
  <div className="p-8 text-center">
    <h2 className="text-3xl font-title font-bold text-primary">{title}</h2>
    <p className="text-muted mt-2">Módulo en construcción...</p>
  </div>
);

const DashboardIndex = () => {
  const { rol } = useAuth(); 

  if (rol === 'recepcion' || rol === 'admin') {
    return <Navigate to="reception" replace />;
  }
  if (rol === 'cosmetologa') {
    return <Navigate to="clinical" replace />;
  }
  
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
          <Route path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />
            
            {/* Rutas de Recepción */}
            <Route path="reception" element={<ProtectedRoute allowedRoles={['admin', 'recepcion']}><ReceptionDashboard /></ProtectedRoute>} />
            <Route path="calendar" element={<ProtectedRoute allowedRoles={['admin', 'recepcion']}><ReceptionCalendar /></ProtectedRoute>} />
            <Route path="clientes" element={<ProtectedRoute allowedRoles={['admin', 'recepcion']}><Placeholder title="Directorio de Clientes" /></ProtectedRoute>} />
            <Route path="pos" element={<ProtectedRoute allowedRoles={['admin', 'recepcion']}><Placeholder title="Punto de Venta" /></ProtectedRoute>} />

            {/* Rutas futuras */}
            {/* <Route path="clinical" element={<ProtectedRoute allowedRoles={['admin', 'cosmetologa']}><ClinicalDashboard /></ProtectedRoute>} /> */}
            
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}