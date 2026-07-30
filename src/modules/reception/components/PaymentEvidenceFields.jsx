// Formatea centavos como moneda nacional
const formatCurrency = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(cents / 100);

// Convierte una entrada visible a centavos
const getInputCents = (value) => {
  // Calcula el importe capturado
  const cents = Math.round(Number(value) * 100);

  // Devuelve únicamente enteros seguros
  return Number.isSafeInteger(cents) && cents >= 0 ? cents : 0;
};

// Presenta evidencia según el método de pago
export default function PaymentEvidenceFields({
  amountCents,
  idPrefix,
  onChange,
  part
}) {
  // Presenta captura de efectivo
  if (part.method === 'efectivo') {
    // Calcula el efectivo capturado
    const receivedCents = getInputCents(part.cashReceived);
    const changeCents = Math.max(receivedCents - amountCents, 0);

    // Devuelve campos de efectivo
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted"
            htmlFor={`${idPrefix}-cash`}>
            Efectivo recibido
          </label>
          <input
            className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            id={`${idPrefix}-cash`}
            inputMode="decimal"
            min={amountCents / 100}
            onChange={(event) => onChange({
              cashReceived: event.target.value
            })}
            placeholder="0.00"
            required
            step="0.01"
            type="number"
            value={part.cashReceived}
          />
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xs font-semibold text-muted">Cambio</p>
          <p className="mt-2 font-title text-xl font-bold text-primary">
            {formatCurrency(changeCents)}
          </p>
        </div>
      </div>
    );
  }

  // Presenta referencia de transferencia
  if (part.method === 'transferencia') {
    // Devuelve el campo obligatorio
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted"
          htmlFor={`${idPrefix}-reference`}>
          Referencia de transferencia
        </label>
        <input
          autoComplete="off"
          className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          id={`${idPrefix}-reference`}
          maxLength={120}
          onChange={(event) => onChange({ reference: event.target.value })}
          required
          type="text"
          value={part.reference}
        />
      </div>
    );
  }

  // Presenta evidencia opcional de tarjeta
  if (part.method === 'tarjeta') {
    // Devuelve los campos de tarjeta
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted"
            htmlFor={`${idPrefix}-reference`}>
            Referencia opcional
          </label>
          <input
            autoComplete="off"
            className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            id={`${idPrefix}-reference`}
            maxLength={120}
            onChange={(event) => onChange({ reference: event.target.value })}
            type="text"
            value={part.reference}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted"
            htmlFor={`${idPrefix}-card`}>
            Últimos cuatro opcionales
          </label>
          <input
            autoComplete="off"
            className="w-full rounded-xl border border-surface-hover bg-surface p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            id={`${idPrefix}-card`}
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => onChange({
              cardLastFour: event.target.value.replace(/\D/g, '').slice(0, 4)
            })}
            pattern="[0-9]{4}"
            type="text"
            value={part.cardLastFour}
          />
        </div>
      </div>
    );
  }

  // Devuelve ausencia de campos
  return null;
}
