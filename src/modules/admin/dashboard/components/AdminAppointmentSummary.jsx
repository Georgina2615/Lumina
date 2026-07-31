import { FiAlertTriangle, FiCalendar } from 'react-icons/fi';
import AdminPanelState from './AdminPanelState';

const appointmentStatusItems = [
  {
    color: 'bg-status-pending',
    key: 'por_confirmar',
    label: 'Por confirmar'
  },
  {
    color: 'bg-status-confirmed',
    key: 'confirmada',
    label: 'Confirmadas'
  },
  {
    color: 'bg-status-incabin',
    key: 'en_cabina',
    label: 'En cabina'
  },
  {
    color: 'bg-secondary',
    key: 'por_cobrar',
    label: 'Por cobrar'
  },
  {
    color: 'bg-status-completed',
    key: 'finalizada',
    label: 'Finalizadas'
  },
  {
    color: 'bg-error',
    key: 'cancelada',
    label: 'Canceladas'
  },
  {
    color: 'bg-muted',
    key: 'no_asistio',
    label: 'No asistieron'
  }
];

// Presenta la distribución real de citas del día
export default function AdminAppointmentSummary({
  data,
  error,
  loading,
  onRetry
}) {
  const hasData = data !== null;
  const isEmpty = hasData
    && data.totalCount === 0
    && data.warningCount === 0;

  // Devuelve el panel operativo de citas
  return (
    <section
      aria-labelledby="admin-appointments-title"
      className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            Operación diaria
          </p>
          <h2
            className="text-xl text-primary"
            id="admin-appointments-title"
          >
            Citas de hoy
          </h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-secondary">
          <FiCalendar aria-hidden="true" size={19} />
        </span>
      </header>

      <AdminPanelState
        empty={isEmpty}
        emptyMessage="No hay citas programadas para hoy"
        error={error}
        hasData={hasData}
        loading={loading}
        onRetry={onRetry}
      >
        <dl className="grid gap-2 sm:grid-cols-2">
          {appointmentStatusItems.map((status) => (
            <div
              className="flex items-center justify-between rounded-xl border border-surface-hover/80 bg-background/55 px-3 py-3"
              key={status.key}
            >
              <dt className="flex items-center gap-2 text-sm text-muted">
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 rounded-full ${status.color}`}
                />
                {status.label}
              </dt>
              <dd className="font-semibold tabular-nums text-primary">
                {data?.statusCounts?.[status.key] ?? 0}
              </dd>
            </div>
          ))}
        </dl>

        {data?.warningCount > 0 && (
          <p className="mt-3 flex items-center gap-2 text-xs text-error">
            <FiAlertTriangle aria-hidden="true" />
            {data.warningCount} citas tienen un estado incompatible
          </p>
        )}
      </AdminPanelState>
    </section>
  );
}
