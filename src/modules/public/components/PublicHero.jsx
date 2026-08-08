import { FiArrowDown, FiCalendar, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import { Reveal } from '../../../shared/components';
import heroImage from '../assets/LuminaHero.jpg';

// Define señales reales de confianza
const trustItems = [
  { icon: FiMapPin, label: 'Atención en Campeche' },
  { icon: FiCalendar, label: 'Reserva en línea' }
];

// Presenta la propuesta principal de Lumina Skin
export default function PublicHero() {
  // Devuelve la portada publica
  return (
    <section className="relative isolate overflow-hidden px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pb-28 lg:pt-16">
      <div aria-hidden="true" className="absolute -left-20 top-16 -z-10 h-72 w-72 rounded-full bg-status-pending/15 blur-3xl motion-safe:animate-pulse" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-status-confirmed/10 blur-3xl" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="relative z-10">
          <Reveal variant="left">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">Cuidado facial personalizado</p>
            <h1 className="mt-5 max-w-2xl text-5xl leading-[0.98] text-primary sm:text-6xl lg:text-7xl">Tu piel merece atención con intención</h1>
          </Reveal>
          <Reveal delay={100} variant="left">
            <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">Tratamientos estéticos pensados para acompañar las necesidades de tu piel, en un espacio sereno y profesional.</p>
          </Reveal>
          <Reveal delay={150} variant="left">
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-surface shadow-lg shadow-primary/15 transition duration-300 hover:-translate-y-0.5 hover:bg-secondary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none" href="#servicios">Conocer servicios<FiArrowDown aria-hidden="true" /></a>
              <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover bg-surface px-6 text-sm font-semibold text-primary transition duration-300 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none" href="https://wa.me/529811017687" rel="noreferrer" target="_blank"><FiMessageCircle aria-hidden="true" />Escribir por WhatsApp</a>
            </div>
          </Reveal>
          <Reveal delay={200} variant="left">
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-surface-hover pt-5">
              {trustItems.map(({ icon: Icon, label }) => <span className="inline-flex items-center gap-2 text-xs font-medium text-muted" key={label}><Icon aria-hidden="true" className="text-status-confirmed" />{label}</span>)}
            </div>
          </Reveal>
        </div>

        <Reveal className="relative" delay={100} variant="scale">
          <div aria-hidden="true" className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-status-pending/15 blur-2xl" />
          <div className="group overflow-hidden rounded-[2rem] border border-surface-hover bg-surface shadow-2xl shadow-primary/10">
            <img alt="Composición de cuidado facial con textiles y recipientes cosméticos" className="aspect-[16/10] h-full w-full object-cover transition duration-700 group-hover:scale-[1.025] motion-reduce:transform-none" fetchPriority="high" src={heroImage} />
          </div>
          <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-surface-hover bg-background/95 px-5 py-4 shadow-xl backdrop-blur sm:left-8 sm:right-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Lumina Skin</p>
            <p className="mt-1 font-title text-lg font-semibold text-primary">Estética facial en Campeche</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
