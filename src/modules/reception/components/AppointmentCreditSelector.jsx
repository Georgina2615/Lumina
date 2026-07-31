// Formatea centavos como moneda nacional
const formatCurrency = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(cents / 100);

// Formatea una fecha civil sin cambiar su día
const formatDate = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

// Presenta créditos reales de cancelaciones de la clínica
export default function AppointmentCreditSelector({
  additionalDepositCents,
  creditChoice,
  credits,
  error,
  loading,
  onChange,
  onRetry,
  requiredDepositCents,
  selectedCredit,
  servicePriceCents
}) {
  // Presenta la consulta activa
  if (loading) {
    return (
      <div aria-live="polite"
        className="rounded-2xl border border-surface-hover bg-surface p-4 text-sm text-muted">
        Consultando créditos disponibles
      </div>
    );
  }

  // Presenta un error recuperable
  if (error) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-4"
        role="alert">
        <p className="text-sm text-error">{error}</p>
        <button className="mt-3 rounded-xl border border-error/30 px-4 py-2 text-sm font-semibold text-error"
          onClick={onRetry} type="button">Reintentar consulta</button>
      </div>
    );
  }

  // Oculta la sección cuando no existen créditos
  if (credits.length === 0) {
    return null;
  }

  // Devuelve la elección accesible del crédito
  return (
    <section className="border-t border-surface-hover pt-5">
      <fieldset>
        <legend>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Reprogramación disponible
          </span>
          <span className="mt-1 block font-title text-lg font-semibold text-primary">
            Aplicar un anticipo conservado
          </span>
        </legend>
        <p className="mt-2 text-sm leading-6 text-muted">
          Elige un crédito de una cita cancelada por la clínica o continúa con un anticipo nuevo
        </p>

        <div className="mt-4 grid gap-3">
          <label className={`cursor-pointer rounded-2xl border p-4 transition ${
            creditChoice === 'none'
              ? 'border-primary bg-primary/5 shadow-sm'
              : 'border-surface-hover bg-background hover:border-primary/30'
          }`}>
            <input checked={creditChoice === 'none'}
              className="mr-3 accent-primary" name="appointment-credit"
              onChange={() => onChange('none')} type="radio" />
            <span className="font-semibold text-primary">No usar crédito</span>
            <span className="mt-1 block pl-7 text-xs text-muted">
              Registrar un anticipo nuevo
            </span>
          </label>

          {credits.map((credit) => (
            <label className={`cursor-pointer rounded-2xl border p-4 transition ${
              creditChoice === credit.sourceAppointmentId
                ? 'border-status-confirmed bg-status-confirmed/10 shadow-sm'
                : 'border-surface-hover bg-background hover:border-status-confirmed/40'
            }`} key={credit.sourceAppointmentId}>
              <span className="flex items-start gap-3">
                <input checked={creditChoice === credit.sourceAppointmentId}
                  className="mt-1 accent-primary" name="appointment-credit"
                  onChange={() => onChange(credit.sourceAppointmentId)}
                  type="radio" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-primary">
                    {credit.serviceName}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {formatDate(credit.dateKey)}
                    {credit.time ? ` a las ${credit.time}` : ''}
                  </span>
                </span>
                <span className="font-title text-lg font-bold text-secondary">
                  {formatCurrency(credit.creditCents)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {selectedCredit && requiredDepositCents > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-3 rounded-2xl bg-surface p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted">Anticipo requerido</dt>
            <dd className="mt-1 font-semibold text-primary">
              {formatCurrency(requiredDepositCents)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Crédito aplicado</dt>
            <dd className="mt-1 font-semibold text-status-confirmed">
              {formatCurrency(selectedCredit.creditCents)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Pago adicional</dt>
            <dd className="mt-1 font-semibold text-secondary">
              {formatCurrency(additionalDepositCents)}
            </dd>
          </div>
        </dl>
      )}

      {selectedCredit && servicePriceCents > 0
        && selectedCredit.creditCents > servicePriceCents && (
        <p className="mt-3 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error"
          role="alert">
          El crédito supera el precio del servicio seleccionado
        </p>
      )}
    </section>
  );
}
