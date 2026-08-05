import { formatCabinQuantity } from '../../../../../shared/services/CabinQuantityService';

// Presenta existencias y nivel de atención
export default function CabinSupplyStock({ detailed = false, supply }) {
  const isSoldOut = supply.stockScaled === 0;
  const isLow = !isSoldOut
    && supply.stockScaled <= supply.minimumStockScaled;
  const tone = isSoldOut
    ? 'border-error/20 bg-error/10 text-error'
    : isLow
      ? 'border-status-pending/30 bg-status-pending/15 text-primary'
      : 'border-status-confirmed/25 bg-status-confirmed/10 text-primary';
  const label = isSoldOut ? 'Agotado' : isLow ? 'Por agotarse' : 'Disponible';

  // Devuelve cantidad y referencia mínima
  return (
    <div className={detailed ? '' : 'text-right'}>
      <p className="font-title text-xl font-bold tabular-nums text-primary">
        {formatCabinQuantity(supply.stockScaled, supply.unit)}
      </p>
      <div className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone}`}>
        {label}
      </div>
      {detailed && (
        <p className="mt-1.5 text-xs text-muted">
          Avisar cuando queden {formatCabinQuantity(
            supply.minimumStockScaled,
            supply.unit
          )}
        </p>
      )}
    </div>
  );
}
