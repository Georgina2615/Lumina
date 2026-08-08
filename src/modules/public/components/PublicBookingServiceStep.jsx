import { FiCheck, FiClock } from 'react-icons/fi';
import { formatPublicPrice } from '../services/PublicBookingPolicy';

// Convierte minutos reales en una duracion legible
const formatDuration = (durationMinutes) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  // Devuelve la duracion sin valores vacios
  return `${hours ? `${hours} h` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes} min` : ''}`;
};

// Presenta los servicios reales disponibles
export default function PublicBookingServiceStep({
  error,
  loading,
  onSelect,
  selectedId,
  services
}) {
  // Devuelve el catalogo seleccionable
  return (
    <section aria-labelledby="booking-service-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Paso uno</p>
      <h2 className="mt-2 text-2xl sm:text-3xl" id="booking-service-title">Elige tu tratamiento</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Todos los precios incluyen IVA.</p>

      {loading && <div className="mt-7 grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((item) => <div className="h-40 animate-pulse rounded-2xl bg-surface-hover/60" key={item} />)}</div>}
      {!loading && error && <p className="mt-7 rounded-2xl bg-error/10 p-4 text-sm text-error" role="alert">{error}</p>}
      {!loading && !error && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {services.map((service) => {
            const selected = selectedId === service.id;
            return (
              <button aria-pressed={selected} className={`relative rounded-2xl border p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] motion-reduce:transform-none sm:p-5 ${selected ? 'border-brand-gold bg-brand-blush/35 shadow-sm ring-1 ring-brand-gold/30' : 'border-surface-hover bg-background hover:border-brand-gold/50'}`} key={service.id} onClick={() => onSelect(service.id)} type="button">
                {selected && <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-surface"><FiCheck aria-hidden="true" /></span>}
                <h3 className="pr-10 text-lg sm:text-xl">{service.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted sm:min-h-12">{service.description || 'Atención estética adaptada a las necesidades de tu piel.'}</p>
                <div className="mt-4 flex items-center justify-between border-t border-surface-hover pt-4">
                  <span className="font-title text-xl font-semibold">{formatPublicPrice(service.priceCents)}</span>
                  {service.durationMinutes > 0 && <span className="flex items-center gap-1 text-xs text-muted"><FiClock aria-hidden="true" />{formatDuration(service.durationMinutes)}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
