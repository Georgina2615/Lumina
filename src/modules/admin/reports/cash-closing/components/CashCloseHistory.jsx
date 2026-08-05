import { formatCashCloseCurrency } from '../services/AdminCashClosePolicy';

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
});

// Presenta los cortes guardados recientemente
export default function CashCloseHistory({ closes = [], onSelect }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm">
      <div className="border-b border-surface-hover px-4 py-4 sm:px-5">
        <h2 className="text-xl text-primary">Cortes guardados</h2>
      </div>

      {closes.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">Todavía no hay cortes guardados</p>
      ) : (
        <ul className="divide-y divide-surface-hover">
          {closes.map((close) => {
            const difference = close.differenceCents ?? 0;
            return (
              <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5" key={close.id}>
                <div>
                  <p className="font-semibold text-primary">
                    {dateFormatter.format(new Date(`${close.dateKey}T12:00:00Z`))}
                  </p>
                  <p className="text-xs text-muted">
                    {close.paymentCount} {close.paymentCount === 1 ? 'cobro' : 'cobros'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{formatCashCloseCurrency(close.totalCents)}</p>
                  <p className={`text-xs ${difference === 0 ? 'text-status-confirmed' : 'text-error'}`}>
                    {difference === 0 ? 'Efectivo correcto' : difference > 0
                      ? `Sobraron ${formatCashCloseCurrency(difference)}`
                      : `Faltaron ${formatCashCloseCurrency(Math.abs(difference))}`}
                  </p>
                </div>
                <button
                  className="min-h-10 rounded-xl border border-surface-hover px-4 text-sm font-semibold text-primary hover:bg-background"
                  onClick={() => onSelect(close.dateKey)}
                  type="button"
                >
                  Ver corte
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
