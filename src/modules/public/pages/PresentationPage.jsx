import { FiArrowUpRight, FiCheck, FiMonitor, FiPlay } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Conserva el enlace real del video cuando este disponible
const presentationVideoUrl = '';

// Enumera las areas principales que forman el proyecto
const presentationHighlights = [
  'Recepción y agenda',
  'Administración e inventarios',
  'Experiencia clínica y pública'
];

// Presenta el acceso publico al proyecto y su recorrido
export default function PresentationPage() {
  // Detecta si existe un video real para mostrar
  const videoIsAvailable = Boolean(presentationVideoUrl);

  // Devuelve una experiencia independiente para el codigo QR
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background px-5 py-8 text-primary sm:px-8 sm:py-12">
      <div aria-hidden="true" className="absolute -left-28 top-20 h-72 w-72 rounded-full bg-status-confirmed/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-status-pending/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-5xl items-center justify-center sm:min-h-[calc(100dvh-6rem)]">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-surface-hover bg-surface/90 shadow-2xl shadow-primary/10 backdrop-blur lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex flex-col justify-between overflow-hidden border-b border-surface-hover bg-primary px-6 py-8 text-surface sm:px-10 sm:py-10 lg:border-b-0 lg:border-r">
            <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full border border-status-pending/30" />
            <div aria-hidden="true" className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-status-pending/20" />

            <div className="relative">
              <span className="inline-flex rounded-full border border-surface/20 bg-surface/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-surface/80">
                Proyecto académico
              </span>
              <img
                alt="Lumina Skin"
                className="mt-8 w-full max-w-sm rounded-2xl bg-background px-5 py-4"
                src="/LuminaLogo.svg"
              />
            </div>

            <div className="relative mt-10">
              <p className="max-w-sm text-sm leading-6 text-surface/75">
                Un sistema integral que conecta la atención de cada clienta con la operación diaria de Lumina Skin
              </p>
              <ul className="mt-6 space-y-3">
                {presentationHighlights.map((highlight) => (
                  <li className="flex items-center gap-3 text-sm font-medium" key={highlight}>
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-pending/20 text-status-pending">
                      <FiCheck aria-hidden="true" />
                    </span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              Elige cómo conocer Lumina
            </p>
            <h1 className="mt-3 max-w-xl text-4xl leading-tight sm:text-5xl">
              Descubre el proyecto a tu manera
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Explora directamente el sistema o acompáñanos en un recorrido breve por sus funciones principales
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                className="group flex min-h-44 flex-col justify-between rounded-2xl bg-primary p-5 text-surface shadow-lg shadow-primary/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none"
                to="/"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface/10">
                  <FiMonitor aria-hidden="true" size={21} />
                </span>
                <span className="mt-7 flex items-end justify-between gap-3">
                  <span>
                    <span className="block font-title text-xl font-semibold">
                      Explorar Lumina
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-surface/65">
                      Abre la experiencia completa
                    </span>
                  </span>
                  <FiArrowUpRight aria-hidden="true" className="shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transform-none" size={20} />
                </span>
              </Link>

              {videoIsAvailable ? (
                <a
                  aria-label="Ver presentación en una pestaña nueva"
                  className="group flex min-h-44 flex-col justify-between rounded-2xl border border-surface-hover bg-background p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none"
                  href={presentationVideoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-status-pending/20 text-secondary">
                    <FiPlay aria-hidden="true" size={20} />
                  </span>
                  <span className="mt-7 flex items-end justify-between gap-3">
                    <span>
                      <span className="block font-title text-xl font-semibold">
                        Ver presentación
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted">
                        Conoce el proyecto paso a paso
                      </span>
                    </span>
                    <FiArrowUpRight aria-hidden="true" className="shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transform-none" size={20} />
                  </span>
                </a>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex min-h-44 flex-col justify-between rounded-2xl border border-surface-hover bg-background/60 p-5 text-muted"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-hover/60">
                      <FiPlay aria-hidden="true" size={20} />
                    </span>
                    <span className="rounded-full bg-status-pending/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-secondary">
                      En preparación
                    </span>
                  </span>
                  <span className="mt-7">
                    <span className="block font-title text-xl font-semibold text-primary">
                      Ver presentación
                    </span>
                    <span className="mt-1 block text-xs leading-5">
                      Se habilitará con el video final
                    </span>
                  </span>
                </div>
              )}
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}
