import {
  FiAlertTriangle,
  FiArchive,
  FiDollarSign,
  FiDroplet
} from 'react-icons/fi';
import { formatCabinCurrency } from '../services/CabinInventoryPolicy';

const metricDefinitions = [
  {
    id: 'activeSupplies',
    icon: FiDroplet,
    label: 'Insumos activos',
    tone: 'bg-status-confirmed/15 text-status-confirmed'
  },
  {
    id: 'lowStock',
    icon: FiAlertTriangle,
    label: 'Stock bajo',
    tone: 'bg-status-pending/20 text-secondary'
  },
  {
    id: 'soldOut',
    icon: FiArchive,
    label: 'Agotados',
    tone: 'bg-error/10 text-error'
  },
  {
    id: 'inventoryValue',
    icon: FiDollarSign,
    label: 'Valor registrado',
    tone: 'bg-status-incabin/15 text-status-incabin'
  }
];

// Resume el estado sin sumar unidades incompatibles
export default function CabinInventorySummary({
  costsUnavailable,
  loading,
  supplies,
  unavailable
}) {
  const activeSupplies = supplies.filter((supply) => supply.active);
  const inventoryValueCents = supplies.reduce(
    (total, supply) => total + (supply.inventoryValueCents ?? 0),
    0
  );
  const hasMissingCosts = supplies.some((supply) => (
    supply.inventoryValueCents === null
  ));
  const metrics = {
    activeSupplies: unavailable ? 'Sin datos' : String(activeSupplies.length),
    inventoryValue: unavailable
      ? 'Sin datos'
      : costsUnavailable
      ? 'Sin acceso'
      : hasMissingCosts
        ? 'Incompleto'
        : formatCabinCurrency(inventoryValueCents),
    lowStock: unavailable
      ? 'Sin datos'
      : String(activeSupplies.filter((supply) => (
        supply.stockScaled > 0
        && supply.stockScaled <= supply.minimumStockScaled
      )).length),
    soldOut: unavailable
      ? 'Sin datos'
      : String(activeSupplies.filter((supply) => (
        supply.stockScaled === 0
      )).length)
  };

  // Presenta indicadores comparables y valor monetario
  return (
    <section
      aria-label="Resumen del inventario de cabina"
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
              <span className="block h-8 w-20 rounded-lg bg-surface-hover motion-safe:animate-pulse" />
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
