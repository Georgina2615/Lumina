import { FiArrowRight, FiClock, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Reveal } from '../../../shared/components';
import PublicCard from './PublicCard';

// Formatea precios mexicanos con IVA incluido
const formatPrice = (priceCents) => new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
}).format(priceCents / 100);

// Convierte la duración en horas y minutos
const formatDuration = (durationMinutes) => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return `${hours ? `${hours} h` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes} min` : ''}`;
};

// Define variaciones suaves para las tarjetas
const cardTones = [
  'from-brand-blush/45 via-brand-ivory to-brand-ivory',
  'from-brand-sage/15 via-brand-ivory to-brand-ivory',
  'from-brand-gold/15 via-brand-ivory to-brand-ivory'
];

// Presenta una tarjeta comercial de servicio
function PublicServiceCard({ service, index }) {
  // Selecciona una variación visual sin cambiar el significado
  const cardTone = cardTones[index % cardTones.length];

  // Devuelve los datos reales del servicio
  return (
    <PublicCard className={`flex h-full min-h-72 flex-col justify-between overflow-hidden bg-gradient-to-br p-6 ${cardTone}`}>
      <span aria-hidden="true" className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-gold to-transparent" />
      <span aria-hidden="true" className="absolute -right-14 -top-14 h-36 w-36 rounded-full border border-brand-gold/20 transition duration-500 group-hover:scale-110 motion-reduce:transform-none" />
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary font-title text-sm font-semibold text-brand-gold shadow-md shadow-primary/10">
            {String(index + 1).padStart(2, '0')}
          </span>
          {service.durationMinutes && (
            <span className="relative inline-flex items-center gap-1.5 rounded-full border border-brand-blush bg-background/75 px-3 py-1.5 text-xs text-muted backdrop-blur">
              <FiClock aria-hidden="true" />
              {formatDuration(service.durationMinutes)}
            </span>
          )}
        </div>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">Tratamiento facial</p>
        <h3 className="mt-2 text-2xl leading-tight text-primary">{service.name}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {service.description || 'Atención estética adaptada a las necesidades de tu piel.'}
        </p>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-brand-blush pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Precio con IVA</p>
          <p className="mt-1 font-title text-2xl font-semibold text-primary">{formatPrice(service.priceCents)}</p>
        </div>
        <Link aria-label={`Agendar ${service.name}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-xs font-semibold text-surface shadow-md shadow-primary/10 transition duration-300 hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 motion-reduce:transform-none" to={`/agendar?servicio=${encodeURIComponent(service.id)}`}>Agendar cita<FiArrowRight aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" /></Link>
      </div>
    </PublicCard>
  );
}

// Presenta el catalogo real de tratamientos
export default function PublicServicesSection({ error, loading, onRetry, services, showAllLink = false }) {
  // Conserva un solo titulo principal por pantalla
  const TitleTag = showAllLink ? 'h2' : 'h1';

  // Devuelve la seccion con sus estados completos
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-surface via-brand-blush/15 to-surface px-5 py-14 sm:px-8 lg:px-12 lg:py-16">
      <div aria-hidden="true" className="absolute -right-28 top-10 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -left-32 bottom-10 h-72 w-72 rounded-full bg-brand-sage/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">{showAllLink ? 'Una mirada a nuestros tratamientos' : 'Nuestros tratamientos'}</p>
          <TitleTag className="mt-4 text-4xl leading-tight text-primary sm:text-5xl">Un cuidado pensado para cada piel</TitleTag>
          <p className="mt-4 text-base leading-7 text-muted">Consulta precios actuales y elige el tratamiento que deseas conocer.</p>
        </Reveal>

        {loading && (
          <div aria-label="Cargando servicios" className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => <div className="h-64 animate-pulse rounded-3xl bg-surface-hover/60" key={item} />)}
          </div>
        )}

        {!loading && error && (
          <div className="mt-10 rounded-3xl border border-error/20 bg-error/5 px-6 py-8 text-center" role="alert">
            <p className="text-sm font-medium text-error">{error}</p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-surface" onClick={onRetry} type="button">
              <FiRefreshCw aria-hidden="true" />
              Intentar nuevamente
            </button>
          </div>
        )}

        {!loading && !error && services.length === 0 && (
          <p className="mt-10 rounded-3xl border border-surface-hover bg-background px-6 py-10 text-center text-muted">Próximamente publicaremos nuestros tratamientos disponibles.</p>
        )}

        {!loading && !error && services.length > 0 && (
          <>
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {services.map((service, index) => (
                <Reveal className="h-full" delay={[0, 100, 200][index % 3]} key={service.id}>
                  <PublicServiceCard index={index} service={service} />
                </Reveal>
              ))}
            </div>
            {showAllLink && (
              <Reveal className="mt-8 flex justify-center">
                <Link className="inline-flex min-h-12 items-center gap-2 rounded-full border border-secondary/25 bg-background px-6 text-sm font-semibold text-primary transition hover:-translate-y-0.5 hover:border-secondary hover:shadow-md active:scale-[0.98] motion-reduce:transform-none" to="/servicios">Ver todos los servicios<FiArrowRight aria-hidden="true" /></Link>
              </Reveal>
            )}
          </>
        )}
      </div>
    </section>
  );
}
