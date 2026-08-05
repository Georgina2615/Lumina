import { FiCheck, FiEdit3 } from 'react-icons/fi';
import { formatCashCloseCurrency } from '../services/AdminCashClosePolicy';

const moneyFields = [
  {
    field: 'openingCash',
    label: 'Dinero inicial',
    note: 'Efectivo disponible al comenzar el día'
  },
  {
    field: 'withdrawals',
    label: 'Retiros de efectivo',
    note: 'Dinero retirado de caja durante el día'
  },
  {
    field: 'countedCash',
    label: 'Efectivo contado',
    note: 'Dinero que encontraste al contar la caja'
  }
];

// Presenta la captura necesaria para cerrar el dia
export default function CashCloseForm({
  close,
  form,
  onChange,
  onSubmit,
  preview
}) {
  const difference = preview?.differenceCents ?? 0;
  const differenceLabel = difference === 0
    ? 'El efectivo coincide'
    : difference > 0
      ? `Sobra ${formatCashCloseCurrency(difference)}`
      : `Falta ${formatCashCloseCurrency(Math.abs(difference))}`;

  return (
    <section className="rounded-2xl border border-surface-hover bg-surface shadow-sm">
      <div className="border-b border-surface-hover px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-background p-2.5 text-secondary">
            {close ? <FiEdit3 aria-hidden="true" /> : <FiCheck aria-hidden="true" />}
          </span>
          <div>
            <h2 className="text-xl text-primary">
              {close ? 'Corregir corte' : 'Contar el efectivo'}
            </h2>
            <p className="text-sm text-muted">
              {close ? `Corte guardado versión ${close.revision}` : 'Completa los importes para comparar la caja'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          {moneyFields.map((item) => (
            <label className="space-y-1.5" key={item.field}>
              <span className="text-sm font-semibold text-primary">{item.label}</span>
              <span className="flex min-h-11 items-center rounded-xl border border-surface-hover bg-background px-3 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20">
                <span className="mr-2 text-muted">$</span>
                <input
                  className="w-full bg-transparent py-2 outline-none"
                  inputMode="decimal"
                  min="0"
                  onChange={(event) => onChange(item.field, event.target.value)}
                  step="0.01"
                  type="number"
                  value={form[item.field]}
                />
              </span>
              <span className="block text-xs text-muted">{item.note}</span>
            </label>
          ))}
        </div>

        {close && (
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-primary">Motivo de la corrección</span>
            <textarea
              className="min-h-24 w-full resize-y rounded-xl border border-surface-hover bg-background p-3 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              maxLength={200}
              onChange={(event) => onChange('reason', event.target.value)}
              placeholder="Explica qué dato necesitaba corregirse"
              value={form.reason}
            />
          </label>
        )}

        <div className="grid gap-3 rounded-2xl bg-background p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Dinero esperado</p>
            <p className="mt-1 text-2xl text-primary">
              {preview ? formatCashCloseCurrency(preview.expectedCashCents) : 'Revisa los importes'}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Resultado</p>
            <p className={`mt-1 text-lg font-semibold ${
              !preview || difference === 0 ? 'text-status-confirmed' : 'text-error'
            }`}>
              {preview ? differenceLabel : 'Aún no se puede calcular'}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-surface transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!preview}
            onClick={onSubmit}
            type="button"
          >
            {close ? 'Revisar corrección' : 'Revisar corte'}
          </button>
        </div>
      </div>
    </section>
  );
}
