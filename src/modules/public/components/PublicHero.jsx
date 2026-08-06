import { FiArrowDown, FiMessageCircle } from 'react-icons/fi';
import heroImage from '../assets/LuminaHero.jpg';

// Presenta la propuesta principal de Lumina Skin
export default function PublicHero() {
  // Devuelve la portada publica
  return (
    <section className="relative isolate overflow-hidden px-5 pb-16 pt-10 sm:px-8 lg:px-12 lg:pb-24 lg:pt-16">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-secondary">
            Cuidado facial personalizado
          </p>
          <h1 className="mt-5 max-w-2xl text-5xl leading-[0.98] text-primary sm:text-6xl lg:text-7xl">
            Tu piel merece atención con intención
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg">
            Tratamientos estéticos pensados para acompañar las necesidades de tu piel, en un espacio sereno y profesional.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-surface shadow-lg shadow-primary/15 transition duration-300 hover:-translate-y-0.5 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none" href="#servicios">
              Conocer servicios
              <FiArrowDown aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover bg-surface px-6 text-sm font-semibold text-primary transition duration-300 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none" href="https://wa.me/529811017687" rel="noreferrer" target="_blank">
              <FiMessageCircle aria-hidden="true" />
              Escribir por WhatsApp
            </a>
          </div>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-status-pending/15 blur-2xl" />
          <div className="overflow-hidden rounded-[2rem] border border-surface-hover bg-surface shadow-2xl shadow-primary/10">
            <img alt="Composición de cuidado facial con textiles y recipientes cosméticos" className="aspect-[16/10] h-full w-full object-cover" fetchPriority="high" src={heroImage} />
          </div>
          <div className="absolute -bottom-5 left-5 rounded-2xl border border-surface-hover bg-background/95 px-5 py-4 shadow-xl backdrop-blur sm:left-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">Lumina Skin</p>
            <p className="mt-1 font-title text-lg font-semibold text-primary">Estética facial en Campeche</p>
          </div>
        </div>
      </div>
    </section>
  );
}
