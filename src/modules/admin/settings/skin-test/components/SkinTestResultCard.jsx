// Presenta una recomendación configurable
export default function SkinTestResultCard({
  label,
  onUpdate,
  products,
  result,
  services
}) {
  const toggleProduct = (productId) => {
    const selected = result.productIds.includes(productId);
    const productIds = selected
      ? result.productIds.filter((id) => id !== productId)
      : [...result.productIds, productId].slice(0, 3);
    onUpdate({ productIds });
  };

  return (
    <article className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
      <div className="mt-4 grid gap-4">
        <label className="text-xs font-semibold text-muted">Título<input className="mt-1 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm text-primary outline-none focus:border-secondary" maxLength={80} onChange={(event) => onUpdate({ title: event.target.value })} value={result.title} /></label>
        <label className="text-xs font-semibold text-muted">Explicación<textarea className="mt-1 min-h-24 w-full resize-y rounded-xl border border-surface-hover bg-background px-3 py-2 text-sm font-normal leading-6 text-primary outline-none focus:border-secondary" maxLength={300} onChange={(event) => onUpdate({ summary: event.target.value })} value={result.summary} /></label>
        <label className="text-xs font-semibold text-muted">Servicio recomendado<select className="mt-1 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm font-normal text-primary" onChange={(event) => onUpdate({ serviceId: event.target.value })} value={result.serviceId}><option value="">Selecciona un servicio</option>{services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>
        <fieldset>
          <legend className="text-xs font-semibold text-muted">Productos opcionales hasta tres</legend>
          {products.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{products.map((product) => <label className={`cursor-pointer rounded-full border px-3 py-2 text-xs transition ${result.productIds.includes(product.id) ? 'border-primary bg-primary text-surface' : 'border-surface-hover bg-background text-muted'}`} key={product.id}><input checked={result.productIds.includes(product.id)} className="sr-only" disabled={!result.productIds.includes(product.id) && result.productIds.length >= 3} onChange={() => toggleProduct(product.id)} type="checkbox" />{product.name}</label>)}</div> : <p className="mt-2 text-xs text-muted">Puedes agregar productos más adelante</p>}
        </fieldset>
      </div>
    </article>
  );
}
