// Presenta una métrica verificable sin sugerir interacción
export default function AdminMetricCard({
  description,
  error,
  icon: MetricIcon,
  label,
  loading,
  value
}) {
  // Devuelve la tarjeta semántica de definición
  return (
    <div className="relative rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-secondary/30 hover:shadow-md">
      <dt className="mb-5 pr-12 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        <span>
          {label}
        </span>
        <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-background text-secondary">
          <MetricIcon aria-hidden="true" size={19} />
        </span>
      </dt>

      {loading ? (
        <dd
          aria-label={`Cargando ${label.toLowerCase()}`}
          className="space-y-2"
          role="status"
        >
          <span className="block h-9 w-28 rounded-lg bg-surface-hover motion-safe:animate-pulse" />
          <span className="block h-3 w-40 rounded bg-surface-hover/70 motion-safe:animate-pulse" />
        </dd>
      ) : (
        <dd>
          <span className={`block font-title text-3xl font-semibold ${
            error ? 'text-muted' : 'text-primary'
          }`}>
            {error ? '—' : value}
          </span>
          <span className={`mt-2 block text-xs leading-relaxed ${
            error ? 'text-error' : 'text-muted'
          }`}>
            {error || description}
          </span>
        </dd>
      )}
    </div>
  );
}
