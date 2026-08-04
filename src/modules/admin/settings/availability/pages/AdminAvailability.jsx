import { FiCheckCircle, FiLock, FiRefreshCw, FiX } from 'react-icons/fi';
import AvailabilityActionDialog from '../components/AvailabilityActionDialog';
import AvailabilitySlotList from '../components/AvailabilitySlotList';
import UpcomingAvailabilityBlocks from '../components/UpcomingAvailabilityBlocks';
import { useAdminAvailability } from '../hooks/UseAdminAvailability';
import { formatAvailabilityDate } from '../services/AdminAvailabilityPolicy';

// Presenta el control real de disponibilidad
export default function AdminAvailability() {
  const availability = useAdminAvailability();

  // Devuelve la pantalla administrativa completa
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">
            Disponibilidad de agenda
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
            Bloquea los horarios en los que Lumina no podrá atender
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-surface-hover/50"
          onClick={availability.reload}
          type="button"
        >
          <FiRefreshCw aria-hidden="true" />
          Actualizar
        </button>
      </header>

      {availability.feedback && (
        <div className="flex items-center gap-3 rounded-2xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3" role="status">
          <FiCheckCircle aria-hidden="true" className="text-status-confirmed" />
          <p className="flex-1 text-sm font-medium text-primary">{availability.feedback}</p>
          <button aria-label="Cerrar aviso" className="rounded-lg p-1 text-muted hover:bg-background" onClick={() => availability.setFeedback(null)} type="button">
            <FiX aria-hidden="true" />
          </button>
        </div>
      )}

      {availability.error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-error">{availability.error}</p>
          <button className="min-h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={availability.reload} type="button">
            Reintentar
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className="min-w-56 flex-1 text-sm font-semibold text-muted sm:max-w-xs">
            Fecha
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-4 text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              min={availability.todayDateKey}
              onChange={(event) => availability.setSelectedDateKey(event.target.value)}
              type="date"
              value={availability.selectedDateKey}
            />
          </label>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-muted sm:block">
              {formatAvailabilityDate(availability.selectedDateKey)}
            </p>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!availability.canBlockDay || availability.isLoading}
              onClick={availability.openBlockDay}
              type="button"
            >
              <FiLock aria-hidden="true" />
              Bloquear día
            </button>
          </div>
        </div>
      </section>

      <AvailabilitySlotList
        loading={availability.isLoading}
        onBlock={availability.openBlockSlot}
        onReopen={availability.openReopenSlot}
        slots={availability.slots}
      />

      <section>
        <h2 className="mb-3 text-xl text-primary">Próximos bloqueos</h2>
        <UpcomingAvailabilityBlocks
          blocks={availability.upcomingBlocks}
          onOpenDate={availability.setSelectedDateKey}
          onReopen={availability.openReopenSlot}
        />
      </section>

      {availability.dialog && (
        <AvailabilityActionDialog
          busy={availability.isMutating}
          dialog={availability.dialog}
          error={availability.mutationError}
          onClose={availability.closeDialog}
          onConfirm={availability.confirmAction}
        />
      )}
    </div>
  );
}
