import { FiAlertTriangle, FiPackage } from 'react-icons/fi';
import AdminPanelState from './AdminPanelState';

// Presenta productos activos que requieren abastecimiento
export default function AdminLowStockPanel({
  data,
  error,
  loading,
  onRetry
}) {
  const products = data?.lowStockProducts ?? [];
  const hasData = data !== null;
  const isEmpty = hasData
    && products.length === 0
    && data.warningCount === 0;

  // Devuelve el panel de inventario crítico
  return (
    <section
      aria-labelledby="admin-stock-title"
      className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm"
    >
      <header className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
            Inventario retail
          </p>
          <h2 className="text-xl text-primary" id="admin-stock-title">
            Stock que requiere atención
          </h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-background text-secondary">
          <FiPackage aria-hidden="true" size={19} />
        </span>
      </header>

      <AdminPanelState
        empty={isEmpty}
        emptyMessage="El inventario activo está por encima de su mínimo"
        error={error}
        hasData={hasData}
        loading={loading}
        onRetry={onRetry}
      >
        <ul className="space-y-2">
          {products.slice(0, 5).map((product) => (
            <li
              className="flex items-center justify-between gap-3 rounded-xl border border-surface-hover/80 px-3 py-3 transition-colors hover:bg-background/60"
              key={product.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">
                  {product.name}
                </p>
                <p className="truncate text-xs text-muted">
                  {product.category}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={`text-sm font-bold tabular-nums ${
                  product.stock === 0 ? 'text-error' : 'text-primary'
                }`}>
                  {product.stock} unidades
                </p>
                <p className="text-[11px] text-muted">
                  Mínimo {product.minimumStock}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {products.length > 5 && (
          <p className="mt-3 text-center text-xs text-muted">
            Hay {products.length - 5} productos adicionales con stock bajo
          </p>
        )}

        {data?.warningCount > 0 && (
          <p className="mt-3 flex items-center gap-2 text-xs text-error">
            <FiAlertTriangle aria-hidden="true" />
            {data.warningCount} productos tienen datos incompatibles
          </p>
        )}
      </AdminPanelState>
    </section>
  );
}
