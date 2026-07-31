import { FiAlertTriangle, FiShoppingBag } from 'react-icons/fi';
import AdminPanelState from './AdminPanelState';
import { adminBusinessTimeZone } from '../services/AdminDashboardPeriodService';

const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

const saleTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  timeZone: adminBusinessTimeZone
});

const paymentMethodLabels = {
  efectivo: 'Efectivo',
  mixto: 'Mixto',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia'
};

// Formatea centavos canónicos para la interfaz
const formatCurrency = (cents) => currencyFormatter.format(cents / 100);

// Presenta ventas confirmadas sin inferir utilidad
export default function AdminRecentSales({
  data,
  error,
  loading,
  onRetry
}) {
  const sales = data?.recentSales ?? [];
  const hasData = data !== null;
  const isEmpty = hasData
    && sales.length === 0
    && data.warningCount === 0;

  // Devuelve la actividad financiera reciente
  return (
    <section
      aria-labelledby="admin-sales-title"
      className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm"
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            Actividad comercial
          </p>
          <h2 className="text-xl text-primary" id="admin-sales-title">
            Ventas recientes
          </h2>
        </div>
        <div className="flex items-center gap-3">
          {hasData && (
            <div className="text-right">
              <p className="text-xs text-muted">Venta bruta de hoy</p>
              <p className="font-semibold tabular-nums text-primary">
                {formatCurrency(data.todayGrossCents)}
              </p>
            </div>
          )}
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-secondary">
            <FiShoppingBag aria-hidden="true" size={19} />
          </span>
        </div>
      </header>

      <AdminPanelState
        empty={isEmpty}
        emptyMessage="Aún no hay ventas registradas"
        error={error}
        hasData={hasData}
        loading={loading}
        onRetry={onRetry}
      >
        <ul className="divide-y divide-surface-hover">
          {sales.map((sale) => (
            <li
              className="grid gap-3 py-4 transition-colors sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center"
              key={sale.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">
                  {sale.clientName}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {sale.folio} · {sale.type === 'cita' ? 'Cita' : 'Mostrador'}
                </p>
              </div>
              <div>
                <time
                  className="text-xs text-muted"
                  dateTime={sale.createdAt.toISOString()}
                >
                  {saleTimeFormatter.format(sale.createdAt)}
                </time>
                <p className="mt-1 text-xs text-secondary">
                  {sale.methods
                    .map((method) => paymentMethodLabels[method] || method)
                    .join(' y ') || 'Método no disponible'}
                </p>
              </div>
              <p className="font-title text-lg font-semibold tabular-nums text-primary sm:text-right">
                {formatCurrency(sale.totalCents)}
              </p>
            </li>
          ))}
        </ul>

        {data?.warningCount > 0 && (
          <p className="mt-3 flex items-center gap-2 text-xs text-error">
            <FiAlertTriangle aria-hidden="true" />
            Algunos registros de venta tienen datos incompatibles
          </p>
        )}
      </AdminPanelState>
    </section>
  );
}
