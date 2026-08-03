import { FiMail } from 'react-icons/fi';

// Presenta el correo opcional para el ticket
export default function POSReceiptEmailField({
  disabled = false,
  error,
  value,
  onBlur,
  onChange
}) {
  // Define identificadores accesibles estables
  const descriptionId = 'pos-receipt-email-description';
  // Define el identificador del error
  const errorId = 'pos-receipt-email-error';
  // Reúne las ayudas vigentes
  const describedBy = error
    ? `${descriptionId} ${errorId}`
    : descriptionId;

  // Devuelve la captura visual
  return (
    <div className="rounded-xl border border-surface-hover bg-background/70 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-status-confirmed/15 p-2 text-status-confirmed">
          <FiMail aria-hidden="true" className="text-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="pos-receipt-email"
            className="flex flex-wrap items-center gap-2 text-sm font-semibold text-primary"
          >
            Correo para el comprobante
            <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
              Opcional
            </span>
          </label>
          <p id={descriptionId} className="mt-1 text-xs leading-5 text-muted">
            Solo envía este comprobante y no crea un expediente
          </p>
        </div>
      </div>

      <input
        id="pos-receipt-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={254}
        disabled={disabled}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        placeholder="cliente@correo.com"
        className="mt-3 w-full rounded-xl border border-surface-hover bg-surface px-3 py-2.5 text-sm text-primary outline-none transition duration-200 placeholder:text-muted/60 focus:border-status-confirmed focus:ring-2 focus:ring-status-confirmed/20 disabled:cursor-not-allowed disabled:opacity-60"
      />

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-xs font-medium text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
