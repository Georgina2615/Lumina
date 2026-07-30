import { formatCurrency } from '../services/SaleCalculationService';

// Presenta el IVA incluido y el anticipo previo
export default function POSTotals({ totals }) {
  // Devuelve el desglose financiero
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-4 text-muted">
        <dt>Subtotal sin IVA</dt>
        <dd className="font-medium">{formatCurrency(totals.netSubtotalCents)}</dd>
      </div>
      <div className="flex justify-between gap-4 text-muted">
        <dt>IVA incluido</dt>
        <dd className="font-medium">{formatCurrency(totals.includedTaxCents)}</dd>
      </div>
      <div className="flex justify-between gap-4 font-semibold text-primary">
        <dt>Total de venta</dt>
        <dd>{formatCurrency(totals.grossTotalCents)}</dd>
      </div>
      {totals.appliedDepositCents > 0 && (
        <div className="flex justify-between gap-4 rounded-lg border border-status-confirmed/30 bg-status-confirmed/10 px-2.5 py-2 font-semibold text-primary">
          <dt>Pagado previamente como anticipo</dt>
          <dd>{formatCurrency(totals.appliedDepositCents)}</dd>
        </div>
      )}
      <div className="flex items-end justify-between gap-4 border-t border-surface-hover pt-3">
        <dt className="font-title font-bold uppercase tracking-widest text-primary">
          Saldo por cobrar
        </dt>
        <dd className="font-title text-3xl font-bold text-primary">
          {formatCurrency(totals.amountDueCents)}
        </dd>
      </div>
    </dl>
  );
}
