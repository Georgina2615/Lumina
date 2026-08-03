import { formatCurrency } from '../services/SaleCalculationService';

// Define métodos individuales
const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' }
];

// Unifica el estilo de captura
const fieldClassName = 'mt-1.5 w-full rounded-xl border border-surface-hover bg-surface px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

// Presenta un selector para pagos mixtos
function PaymentMethodSelect({
  id,
  label,
  value,
  disabledMethod,
  onChange
}) {
  // Devuelve un selector accesible
  return (
    <label htmlFor={id} className="block text-xs font-semibold text-secondary">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        {paymentMethods.map((method) => (
          <option
            key={method.value}
            value={method.value}
            disabled={method.value === disabledMethod}
          >
            {method.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// Presenta la distribución exacta entre dos métodos
export default function POSMixedPaymentFields({
  form,
  secondaryAmountCents,
  onChange
}) {
  // Devuelve la distribución mixta
  return (
    <div className="rounded-xl border border-surface-hover bg-background p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <PaymentMethodSelect
          id="primary-payment-method"
          label="Primera forma de pago"
          value={form.primaryMethod}
          disabledMethod={form.secondaryMethod}
          onChange={(value) => onChange('primaryMethod', value)}
        />
        <PaymentMethodSelect
          id="secondary-payment-method"
          label="Segunda forma de pago"
          value={form.secondaryMethod}
          disabledMethod={form.primaryMethod}
          onChange={(value) => onChange('secondaryMethod', value)}
        />
      </div>
      <label
        htmlFor="primary-payment-amount"
        className="mt-3 block text-xs font-semibold text-secondary"
      >
        Monto de la primera forma de pago
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-muted">
            $
          </span>
          <input
            id="primary-payment-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            required
            value={form.primaryAmount}
            onChange={(event) => onChange(
              'primaryAmount',
              event.target.value
            )}
            className={`${fieldClassName} pl-7`}
            placeholder="0.00"
          />
        </div>
      </label>
      <div className="mt-3 flex justify-between rounded-lg bg-surface px-3 py-2 text-xs">
        <span className="text-muted">Resto con la segunda forma de pago</span>
        <span className="font-semibold text-primary">
          {formatCurrency(secondaryAmountCents)}
        </span>
      </div>
    </div>
  );
}
