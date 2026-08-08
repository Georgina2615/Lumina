import { FiArrowRight, FiMessageCircle, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatPublicPrice } from '../../services/PublicBookingPolicy';

// Presenta un producto relacionado disponible
function RecommendedProduct({ product }) {
  // Devuelve información comercial breve
  return (
    <article className="rounded-2xl border border-surface-hover bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">{product.brand || 'Cuidado en casa'}</p>
      <h3 className="mt-2 font-title text-xl font-semibold text-primary">{product.name}</h3>
      {product.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>}
      <p className="mt-3 text-sm font-semibold text-primary">{formatPublicPrice(product.priceCents)}</p>
    </article>
  );
}

// Presenta la orientación calculada
export default function PublicSkinTestResult({ onRestart, result }) {
  // Devuelve la recomendación sin tratarla como diagnóstico
  return (
    <section aria-labelledby="skin-result-title">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-sage">Tu orientación</p>
      <h1 className="mt-4 text-4xl leading-tight text-primary sm:text-5xl" id="skin-result-title">{result.title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted">{result.summary}</p>
      {result.requiresContact && (
        <div className="mt-6 flex gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/15 p-4 text-sm leading-6 text-primary">
          <FiMessageCircle aria-hidden="true" className="mt-1 shrink-0" />
          Antes de agendar te recomendamos conversar con nuestro personal para elegir el cuidado más adecuado
        </div>
      )}
      <div className="mt-8 rounded-3xl bg-primary p-6 text-surface sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Tratamiento sugerido</p>
        <h2 className="mt-3 text-3xl text-surface">{result.service.name}</h2>
        {result.service.description && <p className="mt-3 max-w-xl text-sm leading-6 text-surface/75">{result.service.description}</p>}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-surface/15 pt-5">
          <p className="font-title text-3xl font-semibold">{formatPublicPrice(result.service.priceCents)}</p>
          {result.requiresContact ? (
            <a className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-gold px-6 text-sm font-semibold text-primary transition hover:brightness-95" href="https://wa.me/529811017687?text=Hola%20realic%C3%A9%20el%20test%20de%20piel%20y%20quiero%20recibir%20orientaci%C3%B3n" rel="noreferrer" target="_blank">Solicitar orientación<FiMessageCircle aria-hidden="true" /></a>
          ) : (
            <Link className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-gold px-6 text-sm font-semibold text-primary transition hover:brightness-95" to={`/agendar?servicio=${encodeURIComponent(result.service.id)}`}>Agendar este tratamiento<FiArrowRight aria-hidden="true" /></Link>
          )}
        </div>
      </div>
      {result.products.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl text-primary">Productos que pueden acompañar tu cuidado</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{result.products.map((product) => <RecommendedProduct key={product.id} product={product} />)}</div>
        </div>
      )}
      <p className="mt-8 text-sm leading-6 text-muted">Este resultado es una orientación estética y no sustituye una valoración médica</p>
      <button className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:text-primary" onClick={onRestart} type="button"><FiRefreshCw aria-hidden="true" />Volver a realizar el test</button>
    </section>
  );
}
