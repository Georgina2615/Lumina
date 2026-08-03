import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import PaymentMethodBreakdown from '../components/PaymentMethodBreakdown';
import PaymentMovementList from '../components/PaymentMovementList';
import ReportPeriodSelector from '../components/ReportPeriodSelector';
import ReportSummary from '../components/ReportSummary';
import { useAdminPaymentsReport } from '../hooks/UseAdminPaymentsReport';

// Presenta indicadores temporales durante la consulta
const ReportLoadingState = () => (
  <div aria-label="Cargando cobros y ventas" className="space-y-5" role="status">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          className="h-36 rounded-2xl border border-surface-hover bg-surface motion-safe:animate-pulse"
          key={item}
        />
      ))}
    </div>
    <div className="h-64 rounded-2xl border border-surface-hover bg-surface motion-safe:animate-pulse" />
  </div>
);

// Presenta los cobros y las ventas del periodo elegido
export default function AdminPaymentsReport() {
  const {
    error,
    hasLoaded,
    isLoading,
    isRefreshing,
    periodKey,
    refreshReport,
    report,
    setPeriodKey
  } = useAdminPaymentsReport();

  // Evita presentar ceros cuando la primera consulta falla
  const shouldShowReport = !isLoading && (!error || hasLoaded);

  // Devuelve la pantalla administrativa completa
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">
            Cobros y ventas
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
            Dinero recibido y ventas terminadas durante el periodo
          </p>
        </div>

        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary shadow-sm transition hover:border-secondary/40 hover:bg-surface-hover/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-wait disabled:opacity-60"
          disabled={isLoading || isRefreshing}
          onClick={refreshReport}
          type="button"
        >
          <FiRefreshCw
            aria-hidden="true"
            className={isRefreshing ? 'motion-safe:animate-spin' : ''}
          />
          {isRefreshing ? 'Actualizando' : 'Actualizar'}
        </button>
      </header>

      <ReportPeriodSelector
        disabled={isLoading || isRefreshing}
        onChange={setPeriodKey}
        periodId={periodKey}
      />

      {error && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 px-4 py-3"
          role="alert"
        >
          <p className="text-sm font-medium text-error">{error}</p>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface"
            onClick={refreshReport}
            type="button"
          >
            <FiRefreshCw aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      {isLoading && <ReportLoadingState />}

      {shouldShowReport && (
        <>
          {report.warningCount > 0 && (
            <div
              className="flex items-start gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-primary"
              role="status"
            >
              <FiAlertTriangle
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-secondary"
              />
              <p>
                Algunos registros tenían información incompleta y no se sumaron
              </p>
            </div>
          )}

          <ReportSummary report={report} />
          <PaymentMethodBreakdown
            methodTotals={report.methodTotals}
            totalReceivedCents={report.totalReceivedCents}
          />
          <PaymentMovementList payments={report.payments} />
        </>
      )}
    </div>
  );
}
