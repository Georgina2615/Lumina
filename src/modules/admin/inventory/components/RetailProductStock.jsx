// Presenta existencias y nivel de atención
export default function RetailProductStock({ product, detailed = false }) {
  const isSoldOut = product.stock === 0;
  const isLow = !isSoldOut && product.stock <= product.minimumStock;
  const tone = isSoldOut
    ? 'border-error/20 bg-error/10 text-error'
    : isLow
      ? 'border-status-pending/30 bg-status-pending/15 text-primary'
      : 'border-status-confirmed/25 bg-status-confirmed/10 text-primary';
  const label = isSoldOut ? 'Agotado' : isLow ? 'Stock bajo' : 'Disponible';

  // Devuelve el indicador con referencia mínima opcional
  return (
    <div className={detailed ? '' : 'text-right'}>
      <p className="font-title text-xl font-bold tabular-nums text-primary">
        {product.stock}
        <span className="ml-1 font-body text-xs font-medium text-muted">
          unidades
        </span>
      </p>
      <div className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${tone}`}>
        {label}
      </div>
      {detailed && (
        <p className="mt-1.5 text-xs text-muted">
          Alerta configurada en {product.minimumStock}
        </p>
      )}
    </div>
  );
}
