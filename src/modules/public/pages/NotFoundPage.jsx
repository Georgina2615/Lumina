import { FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Orienta cuando una dirección no existe
export default function NotFoundPage() {
  return (
    <section className="flex min-h-[65vh] items-center bg-gradient-to-b from-background to-surface px-5 py-16 sm:px-8">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Página no encontrada</p>
        <h1 className="mt-4 text-4xl text-primary sm:text-5xl">Este espacio no está disponible</h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">La dirección puede estar incompleta o la página pudo cambiar de lugar</p>
        <Link className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-surface transition hover:bg-secondary" to="/"><FiArrowLeft aria-hidden="true" />Volver al inicio</Link>
      </div>
    </section>
  );
}
