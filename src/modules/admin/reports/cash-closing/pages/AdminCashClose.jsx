import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import CashCloseConfirmDialog from '../components/CashCloseConfirmDialog';
import CashCloseForm from '../components/CashCloseForm';
import CashCloseHistory from '../components/CashCloseHistory';
import CashCloseOverview from '../components/CashCloseOverview';
import { useAdminCashClose } from '../hooks/UseAdminCashClose';

// Presenta el corte diario de caja
export default function AdminCashClose() {
  const cashClose = useAdminCashClose();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Administración</p>
          <h1 className="text-3xl text-primary sm:text-4xl">Corte diario</h1>
          <p className="mt-1 text-sm text-muted sm:text-base">Compara los cobros registrados con el efectivo contado</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1 text-sm font-semibold text-primary">
            <span className="block">Fecha</span>
            <input
              className="min-h-11 rounded-xl border border-surface-hover bg-surface px-3"
              max={cashClose.maxDate}
              onChange={(event) => cashClose.changeDate(event.target.value)}
              type="date"
              value={cashClose.dateKey}
            />
          </label>
          <button
            aria-label="Actualizar corte"
            className="min-h-11 rounded-xl border border-surface-hover bg-surface px-4 text-primary hover:bg-surface-hover/40"
            disabled={cashClose.isLoading}
            onClick={cashClose.refresh}
            type="button"
          >
            <FiRefreshCw className={cashClose.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {cashClose.error && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error" role="alert">{cashClose.error}</div>}
      {cashClose.success && <div className="rounded-xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3 text-sm text-status-confirmed" role="status">{cashClose.success}</div>}

      {cashClose.isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl border border-surface-hover bg-surface" />
      ) : (
        <>
          {cashClose.day?.warningCount > 0 && (
            <div className="flex gap-3 rounded-xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-primary">
              <FiAlertTriangle className="mt-0.5 shrink-0" />
              Hay cobros que necesitan revisión antes de guardar el corte
            </div>
          )}
          <CashCloseOverview day={cashClose.day} />
          <CashCloseForm
            close={cashClose.day?.close}
            form={cashClose.form}
            onChange={cashClose.changeField}
            onSubmit={cashClose.prepareSave}
            preview={cashClose.preview}
          />
        </>
      )}

      <CashCloseHistory closes={cashClose.history} onSelect={cashClose.changeDate} />
      <CashCloseConfirmDialog
        isCorrection={Boolean(cashClose.day?.close)}
        isSaving={cashClose.isSaving}
        onCancel={cashClose.cancelSave}
        onConfirm={cashClose.confirmSave}
        preview={cashClose.pendingRequest ? cashClose.preview : null}
      />
    </div>
  );
}
