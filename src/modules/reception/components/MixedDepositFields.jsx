import PaymentEvidenceFields from './PaymentEvidenceFields';

// Formatea centavos como moneda nacional
const formatCurrency = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(cents / 100);

// Presenta las dos partes de un anticipo mixto
export default function MixedDepositFields({
  depositCents,
  methods,
  onMethodChange,
  onPartChange,
  payment
}) {
  // Calcula ambas partes visibles
  const primaryAmountCents = Math.round(
    Number(payment.primary.amount || 0) * 100
  );
  const remainingCents = Math.max(depositCents - primaryAmountCents, 0);
  const primaryLabel = methods.find(
    ({ value }) => value === payment.primary.method
  )?.label;
  const secondaryLabel = methods.find(
    ({ value }) => value === payment.secondary.method
  )?.label;

  // Devuelve los campos combinados
  return (
    <div className="mt-4 grid gap-4 rounded-2xl border border-surface-hover bg-background p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {['primary', 'secondary'].map((partName, index) => (
          <div key={partName}>
            <label className="mb-1 block text-xs font-semibold text-muted"
              htmlFor={`${partName}-payment-method`}>
              {index === 0 ? 'Primer método' : 'Segundo método'}
            </label>
            <select
              className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id={`${partName}-payment-method`}
              onChange={(event) => onMethodChange(
                partName,
                event.target.value
              )}
              value={payment[partName].method}
            >
              {methods.map((method) => (
                <option
                  disabled={method.value === payment[
                    partName === 'primary' ? 'secondary' : 'primary'
                  ].method}
                  key={method.value}
                  value={method.value}
                >
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted"
            htmlFor="primary-payment-amount">
            Importe aplicado al primer método
          </label>
          <input
            className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            id="primary-payment-amount"
            inputMode="decimal"
            max={Math.max((depositCents - 1) / 100, 0)}
            min="0.01"
            onChange={(event) => onPartChange('primary', {
              amount: event.target.value
            })}
            required
            step="0.01"
            type="number"
            value={payment.primary.amount}
          />
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs font-semibold text-muted">
            Importe aplicado al segundo método
          </p>
          <p className="mt-2 font-title text-xl font-bold text-primary">
            {formatCurrency(remainingCents)}
          </p>
        </div>
      </div>

      <div aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3">
        <p className="text-sm text-muted">
          {primaryLabel} {formatCurrency(primaryAmountCents)}
          {' + '}
          {secondaryLabel} {formatCurrency(remainingCents)}
        </p>
        <p className="font-semibold text-primary">
          Total {formatCurrency(depositCents)}
        </p>
      </div>

      {[
        {
          amountCents: primaryAmountCents,
          label: `Primer método · ${primaryLabel}`,
          name: 'primary'
        },
        {
          amountCents: remainingCents,
          label: `Segundo método · ${secondaryLabel}`,
          name: 'secondary'
        }
      ].map((part) => (
        <div className="grid gap-3" key={part.name}>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {part.label}
          </p>
          <PaymentEvidenceFields
            amountCents={part.amountCents}
            idPrefix={`deposit-${part.name}`}
            onChange={(changes) => onPartChange(part.name, changes)}
            part={payment[part.name]}
          />
        </div>
      ))}
    </div>
  );
}
