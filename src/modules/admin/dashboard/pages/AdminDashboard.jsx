import { FiRefreshCw, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import AdminAppointmentSummary from '../components/AdminAppointmentSummary';
import AdminLowStockPanel from '../components/AdminLowStockPanel';
import AdminMetricGrid from '../components/AdminMetricGrid';
import AdminRecentSales from '../components/AdminRecentSales';
import { useAdminDashboard } from '../hooks/UseAdminDashboard';
import { adminBusinessTimeZone } from '../services/AdminDashboardPeriodService';

const businessDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  timeZone: adminBusinessTimeZone,
  weekday: 'long',
  year: 'numeric'
});

const updateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: adminBusinessTimeZone
});

// Conserva la escritura natural de la fecha en español
const formatBusinessDate = (date) => {
  const formattedDate = businessDateFormatter.format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

// Presenta la fotografía administrativa del negocio
export default function AdminDashboard() {
  const {
    appointments,
    fatalError,
    finances,
    inventory,
    isLoading,
    isRefreshing,
    loadedAt,
    refreshDashboard,
    sales
  } = useAdminDashboard();

  // Devuelve la pantalla administrativa completa
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">
            Resumen del negocio
          </h1>
          <p className="mt-1 text-muted">
            {formatBusinessDate(loadedAt ?? new Date())}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary shadow-sm transition hover:bg-surface-hover/50 md:hidden"
              to="/dashboard/admin/configuracion/servicios"
            >
              <FiSettings aria-hidden="true" />
              Configurar
            </Link>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-surface shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-wait disabled:opacity-70"
              disabled={isLoading || isRefreshing}
              onClick={refreshDashboard}
              type="button"
            >
              <FiRefreshCw
                aria-hidden="true"
                className={isRefreshing ? 'motion-safe:animate-spin' : ''}
              />
              {isRefreshing ? 'Actualizando' : 'Actualizar datos'}
            </button>
          </div>
          {loadedAt && (
            <p className="text-xs text-muted" role="status">
              Actualizado a las {updateTimeFormatter.format(loadedAt)}
            </p>
          )}
        </div>
      </header>

      {fatalError && (
        <div
          className="rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {fatalError}
        </div>
      )}

      <AdminMetricGrid
        appointments={appointments}
        finances={finances}
        inventory={inventory}
        loading={isLoading}
        refreshing={isRefreshing}
        sales={sales}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <AdminAppointmentSummary
          data={appointments.data}
          error={appointments.error}
          loading={(isLoading || isRefreshing) && !appointments.data}
          onRetry={refreshDashboard}
        />
        <AdminLowStockPanel
          data={inventory.data}
          error={inventory.error}
          loading={(isLoading || isRefreshing) && !inventory.data}
          onRetry={refreshDashboard}
        />
      </div>

      <AdminRecentSales
        data={sales.data}
        error={sales.error}
        loading={(isLoading || isRefreshing) && !sales.data}
        onRetry={refreshDashboard}
      />
    </div>
  );
}
