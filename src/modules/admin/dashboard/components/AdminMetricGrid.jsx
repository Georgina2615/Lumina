import {
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiPackage,
  FiShoppingBag
} from 'react-icons/fi';
import AdminMetricCard from './AdminMetricCard';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Formatea centavos sin alterar su precisión
const formatCurrency = (cents) => currencyFormatter.format(cents / 100);

// Presenta las métricas principales del negocio
export default function AdminMetricGrid({
  appointments,
  finances,
  inventory,
  loading,
  refreshing,
  sales
}) {
  const metrics = [
    {
      description: finances.isStale
        ? 'Último valor disponible'
        : 'Movimientos confirmados del día',
      error: finances.data ? null : finances.error,
      icon: FiDollarSign,
      label: 'Cobrado hoy',
      loading: loading || (refreshing && !finances.data),
      value: formatCurrency(finances.data?.collectedTodayCents ?? 0)
    },
    {
      description: finances.isStale
        ? 'Último valor disponible'
        : 'Pagos confirmados del mes',
      error: finances.data ? null : finances.error,
      icon: FiDollarSign,
      label: 'Cobrado este mes',
      loading: loading || (refreshing && !finances.data),
      value: formatCurrency(finances.data?.collectedMonthCents ?? 0)
    },
    {
      description: appointments.isStale
        ? 'Último valor disponible'
        : 'Excluye cancelaciones e inasistencias',
      error: appointments.data ? null : appointments.error,
      icon: FiCalendar,
      label: 'Citas vigentes hoy',
      loading: loading || (refreshing && !appointments.data),
      value: appointments.data?.activeCount ?? 0
    },
    {
      description: appointments.isStale
        ? 'Último valor disponible'
        : 'Esperan confirmación de asistencia',
      error: appointments.data ? null : appointments.error,
      icon: FiClock,
      label: 'Por confirmar',
      loading: loading || (refreshing && !appointments.data),
      value: appointments.data?.pendingCount ?? 0
    },
    {
      description: sales.isStale
        ? 'Último valor disponible'
        : 'Cierres confirmados en punto de venta',
      error: sales.data ? null : sales.error,
      icon: FiShoppingBag,
      label: 'Ventas de hoy',
      loading: loading || (refreshing && !sales.data),
      value: sales.data?.todayCount ?? 0
    },
    {
      description: inventory.isStale
        ? 'Último valor disponible'
        : 'En o por debajo del mínimo configurado',
      error: inventory.data ? null : inventory.error,
      icon: FiPackage,
      label: 'Productos con stock bajo',
      loading: loading || (refreshing && !inventory.data),
      value: inventory.data?.lowStockProducts.length ?? 0
    }
  ];

  // Devuelve la cuadrícula semántica de definiciones
  return (
    <div>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <AdminMetricCard
            description={metric.description}
            error={metric.error}
            icon={metric.icon}
            key={metric.label}
            label={metric.label}
            loading={metric.loading}
            value={metric.value}
          />
        ))}
      </dl>

      {finances.isStale && finances.error && (
        <p
          className="mt-3 flex items-center gap-2 text-xs text-error"
          role="status"
        >
          <FiAlertTriangle aria-hidden="true" />
          {finances.error} Se conservan los últimos valores financieros
        </p>
      )}

      {finances.data?.warningCount > 0 && (
        <p
          className="mt-3 flex items-center gap-2 text-xs text-error"
          role="alert"
        >
          <FiAlertTriangle aria-hidden="true" />
          Algunos pagos tienen datos incompatibles y no se incluyeron
        </p>
      )}
    </div>
  );
}
