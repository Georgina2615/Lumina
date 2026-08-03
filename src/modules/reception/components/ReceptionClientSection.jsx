import {
  clientNameErrorMessage,
  clientNamePatternSource
} from '../services/AppointmentClientPolicy';

// Presenta la identidad del cliente
export default function ReceptionClientSection({
  client,
  clientFound,
  clientSearchError,
  clientSearchLoading,
  onChange,
  onClearClient,
  onVerifyPhone
}) {
  // Detecta los datos protegidos del directorio
  const isExistingClient = Boolean(clientFound);

  // Actualiza un campo editable
  const handleChange = (event) => {
    onChange(event.target.name, event.target.value);
  };

  // Devuelve la captura de identidad
  return (
    <section aria-busy={clientSearchLoading}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Cliente
          </p>
          <h3 className="mt-1 font-title text-lg font-semibold text-primary">
            Datos de contacto
          </h3>
        </div>
        {clientSearchLoading && (
          <span aria-live="polite" className="text-xs font-semibold text-secondary">
            Verificando teléfono
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="appointment-client-name">
            Nombre completo
          </label>
          <input
            aria-describedby="appointment-client-name-help"
            autoComplete="name"
            className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-hover/60 disabled:text-muted"
            disabled={isExistingClient}
            id="appointment-client-name"
            maxLength={150}
            minLength={2}
            name="fullName"
            onChange={handleChange}
            onInput={(event) => event.currentTarget.setCustomValidity('')}
            onInvalid={(event) => {
              event.currentTarget.setCustomValidity(clientNameErrorMessage);
            }}
            pattern={clientNamePatternSource}
            required
            title={clientNameErrorMessage}
            type="text"
            value={client.fullName}
          />
          <p className="mt-2 text-xs leading-5 text-muted" id="appointment-client-name-help">
            Usa letras espacios apóstrofes o guiones
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="appointment-client-phone">
            Teléfono
          </label>
          <input
            autoComplete="tel-national"
            className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-hover/60 disabled:text-muted"
            disabled={isExistingClient}
            id="appointment-client-phone"
            inputMode="numeric"
            maxLength={10}
            name="phone"
            onBlur={onVerifyPhone}
            onChange={handleChange}
            pattern="[0-9]{10}"
            placeholder="Diez dígitos"
            required
            type="tel"
            value={client.phone}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="appointment-client-email">
            Correo electrónico
            <span className="ml-2 font-normal text-muted">Opcional</span>
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-hover/60 disabled:text-muted"
            disabled={isExistingClient}
            id="appointment-client-email"
            maxLength={254}
            name="email"
            onChange={handleChange}
            placeholder="cliente@correo.com"
            type="email"
            value={client.email}
            aria-describedby="appointment-client-contact-channel"
          />
          <p
            className="mt-2 text-xs leading-5 text-muted"
            id="appointment-client-contact-channel"
          >
            {client.email.trim()
              ? 'Las confirmaciones podrán enviarse por correo electrónico'
              : 'Las confirmaciones deberán hacerse por llamada telefónica'}
          </p>
        </div>
      </div>

      {clientFound && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-confirmed/30 bg-status-confirmed/10 p-4">
          <div>
            <p className="text-sm font-semibold text-primary">Cliente encontrado</p>
            <p className="mt-1 text-xs text-muted">Para cambiar sus datos ve a Clientes</p>
          </div>
          <button
            className="rounded-xl border border-status-confirmed/40 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-status-confirmed/10"
            onClick={onClearClient}
            type="button"
          >
            Usar otro teléfono
          </button>
        </div>
      )}

      {clientSearchError && (
        <div className="mt-4 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error" role="alert">
          {clientSearchError}
        </div>
      )}
    </section>
  );
}
