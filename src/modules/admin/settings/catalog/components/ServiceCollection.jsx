import { FiEdit3, FiEye, FiEyeOff, FiSliders } from 'react-icons/fi';
import { formatServicePrice } from '../services/AdminServiceCatalogPolicy';

// Presenta una tarjeta adaptable por servicio
const ServiceCard = ({ onEdit, onToggle, service }) => {
  const needsReview = !service.canBeOffered;
  const canToggle = service.active || service.canBeOffered;
  const stateLabel = needsReview
    ? 'Necesita revisión'
    : service.active ? 'En agenda' : 'Oculto';

  // Devuelve la informacion esencial del servicio
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm transition duration-200 motion-safe:hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 text-xl leading-tight text-primary">
          {service.displayName}
        </h2>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          needsReview
            ? 'bg-status-pending/20 text-primary'
            : service.active
              ? 'bg-status-confirmed/20 text-primary'
              : 'bg-surface-hover text-muted'
        }`}>
          {stateLabel}
        </span>
      </div>

      {service.publicDescription && (
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {service.publicDescription}
        </p>
      )}

      {needsReview && (
        <p className="mt-3 rounded-xl border border-status-pending/35 bg-status-pending/10 px-3 py-2 text-sm font-medium text-primary">
          Guarda nuevamente el servicio para actualizarlo.
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 border-t border-surface-hover pt-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Precio con IVA
          </p>
          <p className="mt-1 font-title text-2xl font-bold text-primary">
            {formatServicePrice(service.priceCents)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            aria-label={`Editar ${service.displayName}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover px-3 text-sm font-semibold text-primary transition hover:border-secondary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            onClick={() => onEdit(service)}
            type="button"
          >
            <FiEdit3 aria-hidden="true" />
            Editar
          </button>
          <button
            aria-label={`${service.active ? 'Ocultar' : 'Mostrar'} ${service.displayName}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover px-3 text-sm font-semibold text-primary transition hover:border-secondary/40 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!canToggle}
            onClick={() => onToggle(service)}
            type="button"
          >
            {service.active ? (
              <FiEyeOff aria-hidden="true" />
            ) : (
              <FiEye aria-hidden="true" />
            )}
            {service.active ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>
    </article>
  );
};

// Coordina estados y tarjetas del catalogo
export default function ServiceCollection({
  loading,
  onCreate,
  onEdit,
  onToggle,
  services
}) {
  // Presenta esqueletos durante la primera carga
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Cargando servicios"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        role="status"
      >
        <span className="sr-only">Cargando servicios</span>
        {[1, 2, 3, 4, 5].map((item) => (
          <div
            className="h-56 rounded-2xl border border-surface-hover bg-surface motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    );
  }

  // Explica cuando aun no existen servicios
  if (services.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-surface-hover bg-surface px-5 py-10 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
          <FiSliders aria-hidden="true" size={24} />
        </span>
        <h2 className="text-xl text-primary">No hay servicios registrados</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Crea el primer servicio de Lumina Skin
        </p>
        <button
          className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
          onClick={onCreate}
          type="button"
        >
          Crear servicio
        </button>
      </div>
    );
  }

  // Devuelve la coleccion adaptable
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          onEdit={onEdit}
          onToggle={onToggle}
          service={service}
        />
      ))}
    </div>
  );
}
