import {
  FiAlertTriangle,
  FiArchive,
  FiBox,
  FiPackage
} from 'react-icons/fi';

const metricDefinitions = [
  {
    id: 'activeProducts',
    icon: FiPackage,
    label: 'Productos activos',
    tone: 'bg-status-confirmed/15 text-status-confirmed'
  },
  {
    id: 'totalUnits',
    icon: FiBox,
    label: 'Unidades disponibles',
    tone: 'bg-status-incabin/15 text-status-incabin'
  },
  {
    id: 'lowStock',
    icon: FiAlertTriangle,
    label: 'Por agotarse',
    tone: 'bg-status-pending/20 text-secondary'
  },
  {
    id: 'soldOut',
    icon: FiArchive,
    label: 'Agotados',
    tone: 'bg-error/10 text-error'
  }
];

// Resume el estado operativo del catálogo activo
export default function InventorySummary({ products, loading }) {
  const activeProducts = products.filter((product) => product.active);
  const metrics = {
    activeProducts: activeProducts.length,
    lowStock: activeProducts.filter((product) => (
      product.stock > 0 && product.stock <= product.minimumStock
    )).length,
    soldOut: activeProducts.filter((product) => product.stock === 0).length,
    totalUnits: activeProducts.reduce(
      (total, product) => total + product.stock,
      0
    )
  };

  // Presenta métricas compactas y legibles
  return (
    <section
      aria-label="Resumen del inventario"
      className="grid grid-cols-2 gap-3 xl:grid-cols-4"
    >
      {metricDefinitions.map((metric) => {
        const Icon = metric.icon;

        return (
          <article
            className="group rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md motion-reduce:transform-none"
            key={metric.id}
          >
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}>
              <Icon aria-hidden="true" size={18} />
            </div>
            {loading ? (
              <span className="block h-8 w-16 rounded-lg bg-surface-hover motion-safe:animate-pulse" />
            ) : (
              <p className="font-title text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                {metrics[metric.id]}
              </p>
            )}
            <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
              {metric.label}
            </p>
          </article>
        );
      })}
    </section>
  );
}
