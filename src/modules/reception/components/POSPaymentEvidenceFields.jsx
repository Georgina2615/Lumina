import { formatCurrency } from '../services/SaleCalculationService';

// Unifica el estilo de captura
const fieldClassName = 'mt-1.5 w-full rounded-xl border border-surface-hover bg-surface px-3 py-2.5 text-sm text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

// Presenta evidencias y efectivo recibido
export default function POSPaymentEvidenceFields({
  form,
  preview,
  selectedMethods,
  onChange
}) {
  // Detecta evidencias necesarias
  const usesCash = selectedMethods.includes('efectivo');
  // Detecta evidencia de tarjeta
  const usesCard = selectedMethods.includes('tarjeta');
  // Detecta evidencia de transferencia
  const usesTransfer = selectedMethods.includes('transferencia');

  // Devuelve campos según los métodos
  return (
    <>
      {usesCash && (
        <div className="rounded-xl border border-surface-hover bg-background p-3">
          <div className="flex justify-between gap-3 text-xs">
            <span className="font-semibold text-secondary">Pago en efectivo</span>
            <span className="text-muted">
              Monto {formatCurrency(preview.cashAmountCents)}
            </span>
          </div>
          <label
            htmlFor="cash-received"
            className="mt-3 block text-xs font-semibold text-secondary"
          >
            Efectivo recibido
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-muted">
                $
              </span>
              <input
                id="cash-received"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                required
                value={form.cashReceived}
                onChange={(event) => onChange(
                  'cashReceived',
                  event.target.value
                )}
                className={`${fieldClassName} pl-7`}
                placeholder="0.00"
              />
            </div>
          </label>
          <div className="mt-3 flex justify-between rounded-lg bg-status-confirmed/10 px-3 py-2 text-sm font-semibold text-primary">
            <span>Cambio</span>
            <span>{formatCurrency(preview.changeCents)}</span>
          </div>
        </div>
      )}

      {usesCard && (
        <div className="grid gap-3 rounded-xl border border-surface-hover bg-background p-3 sm:grid-cols-2">
          <label htmlFor="card-reference" className="text-xs font-semibold text-secondary">
            Referencia opcional
            <input
              id="card-reference"
              type="text"
              maxLength={120}
              value={form.cardReference}
              onChange={(event) => onChange('cardReference', event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label htmlFor="card-last-four" className="text-xs font-semibold text-secondary">
            Últimos cuatro opcional
            <input
              id="card-last-four"
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={form.cardLastFour}
              onChange={(event) => onChange(
                'cardLastFour',
                event.target.value.replace(/\D/g, '').slice(0, 4)
              )}
              className={fieldClassName}
              placeholder="0000"
            />
          </label>
        </div>
      )}

      {usesTransfer && (
        <label
          htmlFor="transfer-reference"
          className="block rounded-xl border border-surface-hover bg-background p-3 text-xs font-semibold text-secondary"
        >
          Referencia de transferencia
          <input
            id="transfer-reference"
            type="text"
            minLength={3}
            maxLength={120}
            required
            value={form.transferReference}
            onChange={(event) => onChange(
              'transferReference',
              event.target.value
            )}
            className={fieldClassName}
            placeholder="Folio o clave de rastreo"
          />
        </label>
      )}
    </>
  );
}
