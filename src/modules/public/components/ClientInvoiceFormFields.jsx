import {
  clientInvoiceRegimeOptions,
  clientInvoiceUseOptions
} from '../services/ClientInvoicePolicy';

const fieldClass = 'mt-1.5 min-h-12 w-full rounded-xl border border-surface-hover bg-background px-4 text-sm text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15 disabled:opacity-60';

// Presenta los datos necesarios para solicitar factura
export default function ClientInvoiceFormFields({ form, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-primary">
        RFC
        <input
          autoComplete="off"
          className={fieldClass}
          maxLength={13}
          onChange={(event) => onChange('taxId', event.target.value.toUpperCase())}
          placeholder="Escribe el RFC"
          required
          value={form.taxId}
        />
      </label>
      <label className="text-sm font-semibold text-primary">
        Código postal fiscal
        <input
          className={fieldClass}
          inputMode="numeric"
          maxLength={5}
          onChange={(event) => onChange(
            'postalCode',
            event.target.value.replace(/\D/g, '').slice(0, 5)
          )}
          placeholder="Cinco dígitos"
          required
          value={form.postalCode}
        />
      </label>
      <label className="text-sm font-semibold text-primary sm:col-span-2">
        Nombre o razón social
        <input
          className={fieldClass}
          maxLength={200}
          onChange={(event) => onChange('taxpayerName', event.target.value)}
          placeholder="Como aparece en tus datos fiscales"
          required
          value={form.taxpayerName}
        />
      </label>
      <label className="text-sm font-semibold text-primary">
        Régimen fiscal
        <select
          className={fieldClass}
          onChange={(event) => onChange('taxRegime', event.target.value)}
          required
          value={form.taxRegime}
        >
          <option value="">Selecciona una opción</option>
          {clientInvoiceRegimeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value} {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-primary">
        Uso de la factura
        <select
          className={fieldClass}
          onChange={(event) => onChange('invoiceUse', event.target.value)}
          required
          value={form.invoiceUse}
        >
          {clientInvoiceUseOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.value} {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold text-primary sm:col-span-2">
        Correo para recibirla
        <input
          autoComplete="email"
          className={fieldClass}
          maxLength={254}
          onChange={(event) => onChange('deliveryEmail', event.target.value)}
          required
          type="email"
          value={form.deliveryEmail}
        />
      </label>
    </div>
  );
}
