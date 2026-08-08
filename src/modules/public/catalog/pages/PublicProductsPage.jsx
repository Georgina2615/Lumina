import { FiMessageCircle } from 'react-icons/fi';
import PublicCatalogGrid from '../components/PublicCatalogGrid';
import { usePublicCatalog } from '../hooks/UsePublicCatalog';

// Compone el catálogo público de productos
export default function PublicProductsPage() {
  const catalog = usePublicCatalog();

  return (
    <div className="relative min-h-[75vh] overflow-hidden bg-gradient-to-b from-background via-background to-surface px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
      <div aria-hidden="true" className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -left-28 top-80 h-72 w-72 rounded-full bg-brand-sage/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <header className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Cuidado para casa</p>
            <h1 className="mt-4 text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">Productos para acompañar tu rutina</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">Conoce las opciones disponibles en Lumina Skin y pregúntanos cuál puede ajustarse mejor a las necesidades de tu piel</p>
          </div>
          <a className="inline-flex min-h-12 w-fit items-center gap-2 rounded-full border border-brand-gold/50 bg-brand-ivory px-6 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-md motion-reduce:transform-none" href="https://wa.me/529811017687?text=Hola%20quiero%20orientaci%C3%B3n%20sobre%20los%20productos%20de%20Lumina%20Skin" rel="noreferrer" target="_blank"><FiMessageCircle aria-hidden="true" />Pedir orientación</a>
        </header>

        {!catalog.loading && !catalog.error && catalog.products.length > 0 && (
          <div className="my-9 flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Filtrar por categoría">
            {catalog.categories.map((category) => (
              <button aria-pressed={catalog.selectedCategory === category} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-semibold transition duration-200 ${catalog.selectedCategory === category ? 'border-primary bg-primary text-surface shadow-sm ring-2 ring-brand-gold/25' : 'border-brand-blush bg-brand-ivory text-secondary hover:border-brand-gold/60'}`} key={category} onClick={() => catalog.setSelectedCategory(category)} type="button">{category}</button>
            ))}
          </div>
        )}

        <div className={catalog.loading || catalog.error || catalog.products.length === 0 ? 'mt-10' : ''}>
          <PublicCatalogGrid error={catalog.error} loading={catalog.loading} onRetry={catalog.load} products={catalog.visibleProducts} />
        </div>
      </div>
    </div>
  );
}
