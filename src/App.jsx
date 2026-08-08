import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
// Conecta autenticación y autorización
import { AuthProvider, useAuth } from './modules/auth/context';
import { ProtectedRoute } from './modules/auth/components';
// Compone las estructuras globales
import { PublicLayout, DashboardLayout } from './app/layouts';
// Expone las capacidades públicas
import {
  AboutProjectPage, CancellationPolicyPage, ClientAccountPage, LandingPage, NotFoundPage, PresentationPage,
  PrivacyNoticePage, PublicBookingPage, PublicContactPage, PublicProductsPage, PublicServicesPage,
  PublicSkinTestPage, TermsConditionsPage
} from './modules/public/pages';
// Expone las capacidades de recepción
import {
  ReceptionCalendar,
  ReceptionClientDirectory,
  ReceptionDashboard,
  ReceptionLayout,
  ReceptionPOS,
  ReceptionPublicRequests
} from './modules/reception';
// Expone las capacidades administrativas
import {
  AdminAvailability,
  AdminCabinInventory,
  AdminCashClose,
  AdminDashboard,
  AdminInvoices,
  AdminLayout,
  AdminPaymentsReport,
  AdminReportsLayout,
  AdminRetailInventory,
  AdminSkinTest,
  AdminServices,
  AdminSettingsLayout
} from './modules/admin';
// Expone las capacidades clínicas
import {
  CabinConsumption,
  CareRecommendations,
  ClinicalAgenda,
  ClinicalCompletion,
  ClinicalConsent,
  ClinicalDirectory,
  ClinicalLayout,
  ClinicalRecord,
  ClinicalSession
} from './modules/clinical';

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

// Conserva consultas al redirigir enlaces anteriores
const LegacyDashboardRedirect = ({ to }) => {
  const location = useLocation();

  return <Navigate replace to={`${to}${location.search}`} />;
};

// Compone las rutas y proveedores de la aplicación
export default function App() {
  // Devuelve el árbol principal de navegación
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/presentacion" element={<PresentationPage />} />

          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/aviso-privacidad" element={<PrivacyNoticePage />} />
            <Route path="/politica-cancelacion" element={<CancellationPolicyPage />} />
            <Route path="/agendar" element={<PublicBookingPage />} />
            <Route path="/contacto" element={<PublicContactPage />} />
            <Route path="/productos" element={<PublicProductsPage />} />
            <Route path="/servicios" element={<PublicServicesPage />} />
            <Route path="/test-de-piel" element={<PublicSkinTestPage />} />
            <Route path="/mi-cuenta" element={<ClientAccountPage />} />
            <Route path="/sobre-el-proyecto" element={<AboutProjectPage />} />
            <Route path="/terminos-condiciones" element={<TermsConditionsPage />} />
            <Route path="*" element={<NotFoundPage />} />
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
              <Route path="reception" element={<ReceptionLayout />}>
                <Route index element={<ReceptionDashboard />} />
                <Route path="agenda" element={<ReceptionCalendar />} />
                <Route path="clientes" element={<ReceptionClientDirectory />} />
                <Route path="venta" element={<ReceptionPOS />} />
                <Route
                  path="solicitudes"
                  element={<ReceptionPublicRequests />}
                />
              </Route>
              <Route
                path="calendar"
                element={<LegacyDashboardRedirect to="/dashboard/reception/agenda" />}
              />
              <Route
                path="clientes"
                element={<LegacyDashboardRedirect to="/dashboard/reception/clientes" />}
              />
              <Route
                path="pos"
                element={<LegacyDashboardRedirect to="/dashboard/reception/venta" />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route
                  path="inventario-retail"
                  element={<AdminRetailInventory />}
                />
                <Route
                  path="inventario-cabina"
                  element={<AdminCabinInventory />}
                />
                <Route element={<AdminReportsLayout />}>
                  <Route path="cobros" element={<AdminPaymentsReport />} />
                  <Route path="corte-diario" element={<AdminCashClose />} />
                  <Route path="facturas" element={<AdminInvoices />} />
                </Route>
                <Route path="configuracion" element={<AdminSettingsLayout />}>
                  <Route index element={<Navigate to="servicios" replace />} />
                  <Route path="servicios" element={<AdminServices />} />
                  <Route
                  path="disponibilidad"
                  element={<AdminAvailability />}
                />
                <Route path="test-piel" element={<AdminSkinTest />} />
                  <Route
                    path="*"
                    element={(
                      <Navigate
                        to="/dashboard/admin/configuracion/servicios"
                        replace
                      />
                    )}
                  />
                </Route>
              </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['cosmetologa']} />}>
              <Route path="clinical" element={<ClinicalLayout />}>
                <Route index element={<ClinicalAgenda />} />
                <Route path="expedientes" element={<ClinicalDirectory />} />
                <Route
                  path="expediente/:clientId/:appointmentId"
                  element={<ClinicalRecord />}
                />
                <Route
                  path="consentimiento/:clientId/:appointmentId"
                  element={<ClinicalConsent />}
                />
                <Route
                  path="insumos/:clientId/:appointmentId"
                  element={<CabinConsumption />}
                />
                <Route
                  path="recomendaciones/:clientId/:appointmentId"
                  element={<CareRecommendations />}
                />
                <Route
                  path="finalizar/:clientId/:appointmentId"
                  element={<ClinicalCompletion />}
                />
                <Route
                  path="seguimiento/:clientId/:appointmentId"
                  element={<ClinicalSession />}
                />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
