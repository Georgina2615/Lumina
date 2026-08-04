import {
  FiCheckCircle,
  FiClock,
  FiPlus,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';
import ServiceCollection from '../components/ServiceCollection';
import ServiceFormModal from '../components/ServiceFormModal';
import ServiceStatusDialog from '../components/ServiceStatusDialog';
import { useAdminServices } from '../hooks/UseAdminServices';

const policyItems = [
  ['Tratamiento', '2 h 30 min'],
  ['Limpieza de cabina', '30 min'],
  ['Horario reservado', '3 h'],
  ['Anticipo', '30 %']
];

// Presenta la configuracion real de servicios
export default function AdminServices() {
  const catalog = useAdminServices();
  const activeCount = catalog.services.filter((service) => (
    service.active && service.canBeOffered
  )).length;

  // Devuelve la pantalla administrativa completa
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">
            Servicios
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
            Precios y servicios que aparecen al agendar
          </p>
        </div>
        <div className="flex gap-2">
          <button
            aria-label="Actualizar servicios"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary transition hover:bg-surface-hover/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-wait disabled:opacity-60"
            disabled={catalog.isLoading || catalog.isRefreshing}
            onClick={() => catalog.refreshServices()}
            type="button"
          >
            <FiRefreshCw
              aria-hidden="true"
              className={catalog.isRefreshing ? 'motion-safe:animate-spin' : ''}
            />
            <span className="hidden sm:inline">
              {catalog.isRefreshing ? 'Actualizando' : 'Actualizar'}
            </span>
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:bg-secondary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={catalog.isLoading || Boolean(catalog.error)}
            onClick={catalog.openCreateForm}
            type="button"
          >
            <FiPlus aria-hidden="true" />
            Nuevo servicio
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-surface-hover bg-surface px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-status-incabin/10 text-status-incabin">
            <FiClock aria-hidden="true" />
          </span>
          <h2 className="mr-1 font-semibold text-primary">Reglas de cita</h2>
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            {policyItems.map(([label, value]) => (
              <p className="rounded-xl bg-background px-3 py-2 text-sm text-muted" key={label}>
                {label} <strong className="ml-1 text-primary">{value}</strong>
              </p>
            ))}
          </div>
        </div>
      </section>

      {catalog.feedback && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3 shadow-sm"
          role="status"
        >
          <FiCheckCircle className="mt-0.5 text-status-confirmed" />
          <p className="min-w-0 flex-1 text-sm font-medium text-primary">
            {catalog.feedback.message}
          </p>
          <button
            aria-label="Cerrar aviso"
            className="rounded-lg p-1 text-muted hover:bg-background hover:text-primary"
            onClick={() => catalog.setFeedback(null)}
            type="button"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>
      )}

      {catalog.error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 px-4 py-3" role="alert">
          <p className="text-sm font-medium text-error">{catalog.error}</p>
          <button
            className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => catalog.refreshServices()}
            type="button"
          >
            Reintentar
          </button>
        </div>
      )}

      <section aria-label="Catálogo de servicios">
        {!catalog.isLoading && !catalog.error && (
          <p className="mb-3 text-sm text-muted">
            {catalog.services.length} servicios · {activeCount} en agenda
          </p>
        )}
        {(!catalog.error || catalog.services.length > 0) && (
          <ServiceCollection
            loading={catalog.isLoading}
            onCreate={catalog.openCreateForm}
            onEdit={catalog.openEditForm}
            onToggle={catalog.openStatusDialog}
            services={catalog.services}
          />
        )}
      </section>

      {catalog.formOpen && (
        <ServiceFormModal
          busy={catalog.isMutating}
          error={catalog.mutationError}
          key={catalog.formService?.id ?? 'new-service'}
          onClearError={catalog.clearMutationError}
          onClose={catalog.closeForm}
          onSubmit={catalog.formService
            ? catalog.updateService
            : catalog.createService}
          service={catalog.formService}
        />
      )}

      {catalog.statusService && (
        <ServiceStatusDialog
          busy={catalog.isMutating}
          error={catalog.mutationError}
          onClose={catalog.closeStatusDialog}
          onConfirm={catalog.confirmStatusChange}
          service={catalog.statusService}
        />
      )}
    </div>
  );
}
