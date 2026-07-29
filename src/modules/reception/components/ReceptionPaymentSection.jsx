// Define los métodos simples permitidos
const paymentMethods = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' }
];

// Formatea centavos como moneda nacional
const formatCurrency = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(cents / 100);

// Presenta el registro real del anticipo
export default function ReceptionPaymentSection({
  depositCents,
  payment,
  onChange
}) {
  // Detecta el desglose combinado
  const isMixed = payment.method === 'mixto';
  const primaryAmountCents = Math.round(Number(payment.primaryAmount || 0) * 100);
  const remainingCents = Math.max(depositCents - primaryAmountCents, 0);

  // Actualiza una parte del pago
  const updatePayment = (changes) => {
    onChange({ ...payment, ...changes });
  };

  // Cambia el método general
  const handleMethodChange = (method) => {
    updatePayment({
      method,
      primaryMethod: method === 'mixto' ? 'efectivo' : method,
      secondaryMethod: method === 'mixto' ? 'tarjeta' : '',
      primaryAmount: ''
    });
  };

  // Devuelve la captura del anticipo
  return (
    <section className="border-t border-surface-hover pt-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Anticipo obligatorio
          </p>
          <h3 className="mt-1 font-title text-lg font-semibold text-primary">
            Registrar pago del treinta por ciento
          </h3>
        </div>
        <p className="font-title text-2xl font-bold text-primary">
          {formatCurrency(depositCents)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[...paymentMethods, { value: 'mixto', label: 'Mixto' }].map((method) => (
          <button
            aria-pressed={payment.method === method.value}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition duration-200 active:scale-[0.98] ${
              payment.method === method.value
                ? 'border-primary bg-primary text-surface shadow-sm'
                : 'border-surface-hover bg-background text-muted hover:border-primary/40 hover:text-primary'
            }`}
            key={method.value}
            onClick={() => handleMethodChange(method.value)}
            type="button"
          >
            {method.label}
          </button>
        ))}
      </div>

      {isMixed && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-surface-hover bg-background p-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="primary-payment-method">
              Primer método
            </label>
            <select
              className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="primary-payment-method"
              onChange={(event) => updatePayment({ primaryMethod: event.target.value })}
              value={payment.primaryMethod}
            >
              {paymentMethods.map((method) => (
                <option disabled={method.value === payment.secondaryMethod}
                  key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="secondary-payment-method">
              Segundo método
            </label>
            <select
              className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="secondary-payment-method"
              onChange={(event) => updatePayment({ secondaryMethod: event.target.value })}
              value={payment.secondaryMethod}
            >
              {paymentMethods.map((method) => (
                <option disabled={method.value === payment.primaryMethod}
                  key={method.value} value={method.value}>{method.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="primary-payment-amount">
              Importe del primer método
            </label>
            <input
              className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              id="primary-payment-amount"
              inputMode="decimal"
              max={Math.max((depositCents - 1) / 100, 0)}
              min="0.01"
              onChange={(event) => updatePayment({ primaryAmount: event.target.value })}
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={payment.primaryAmount}
            />
          </div>
          <div className="rounded-xl bg-surface p-3">
            <p className="text-xs font-semibold text-muted">Importe restante</p>
            <p className="mt-2 font-title text-xl font-bold text-primary">
              {formatCurrency(remainingCents)}
            </p>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs leading-5 text-muted">
        La cita se confirmará únicamente cuando el anticipo quede registrado
      </p>
    </section>
  );
}
