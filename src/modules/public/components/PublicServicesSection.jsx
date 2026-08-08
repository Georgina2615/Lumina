import { FiArrowRight, FiClock, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Reveal } from '../../../shared/components';

// Formatea precios mexicanos con IVA incluido
const formatPrice = (priceCents) => new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
}).format(priceCents / 100);

// Presenta una tarjeta comercial de servicio
function PublicServiceCard({ service, index }) {
  // Devuelve los datos reales del servicio
  return (
    <article className="group flex h-full min-h-64 flex-col justify-between rounded-3xl border border-surface-hover bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] motion-reduce:transform-none">
      <div>
        <div className="flex items-start justify-between gap-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">
            Tratamiento {String(index + 1).padStart(2, '0')}
          </span>
          {service.durationMinutes && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-muted">
              <FiClock aria-hidden="true" />
              {Math.floor(service.durationMinutes / 60)} h {service.durationMinutes % 60 || ''}
            </span>
          )}
        </div>
        <h3 className="mt-6 text-2xl leading-tight text-primary">{service.name}</h3>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
          {service.description || 'Atención estética adaptada a las necesidades de tu piel.'}
        </p>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4 border-t border-surface-hover pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Precio con IVA</p>
          <p className="mt-1 font-title text-2xl font-semibold text-primary">{formatPrice(service.priceCents)}</p>
        </div>
        <Link aria-label={`Agendar ${service.name}`} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface px-4 text-xs font-semibold text-secondary transition duration-300 hover:bg-primary hover:text-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary" to={`/agendar?servicio=${encodeURIComponent(service.id)}`}>Agendar<FiArrowRight aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" /></Link>
      </div>
    </article>
  );
}

// Presenta el catalogo real de tratamientos
export default function PublicServicesSection({ error, loading, onRetry, services }) {
  // Devuelve la seccion con sus estados completos
  return (
    <section className="scroll-mt-24 bg-surface px-5 py-20 sm:px-8 lg:px-12 lg:py-28" id="servicios">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Nuestros tratamientos</p>
          <h2 className="mt-4 text-4xl leading-tight text-primary sm:text-5xl">Un cuidado pensado para cada piel</h2>
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
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, index) => (
              <Reveal className="h-full" delay={[0, 100, 200][index % 3]} key={service.id}>
                <PublicServiceCard index={index} service={service} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
