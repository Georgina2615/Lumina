// Formatea importes reales en moneda nacional
const formatCurrency = (cents) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(cents / 100);
// Formatea duraciones legibles
const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!hours) {
    return `${remainingMinutes} min`;
  }
  return remainingMinutes ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
};

// Presenta servicio y disponibilidad
export default function ReceptionDetailsSection({
  appointment,
  availabilityDate,
  availabilityError,
  availabilityLoading,
  minDate,
  onChange,
  services,
  servicesError,
  servicesLoading,
  timeOptions
}) {
  const selectedService = services.find(
    (service) => service.id === appointment.serviceId
  );
  const availabilityReady = Boolean(appointment.dateKey)
    && availabilityDate === appointment.dateKey
    && !availabilityLoading
    && !availabilityError;

  // Actualiza un campo de la cita
  const handleChange = (event) => {
    onChange(event.target.name, event.target.value);
  };

  // Devuelve la captura de servicio y horario
  return (
    <section className="border-t border-surface-hover pt-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Cita
        </p>
        <h3 className="mt-1 font-title text-lg font-semibold text-primary">
          Tratamiento y horario
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="appointment-service">
            Servicio
          </label>
          <select
            className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={servicesLoading || Boolean(servicesError)}
            id="appointment-service"
            name="serviceId"
            onChange={handleChange}
            required
            value={appointment.serviceId}
          >
            <option value="">
              {servicesLoading ? 'Cargando servicios' : 'Selecciona un servicio'}
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} · {formatCurrency(service.priceCents)}
              </option>
            ))}
          </select>
          {servicesError && (
            <p className="mt-2 text-sm text-error" role="alert">{servicesError}</p>
          )}
        </div>

        {selectedService && (
          <dl className="grid grid-cols-2 gap-2 rounded-2xl border border-surface-hover bg-background p-4 text-sm sm:col-span-2 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted">Precio</dt>
              <dd className="mt-1 font-semibold text-primary">
                {formatCurrency(selectedService.priceCents)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Duración del servicio</dt>
              <dd className="mt-1 font-semibold text-primary">
                {formatDuration(selectedService.serviceDurationMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Preparación y limpieza</dt>
              <dd className="mt-1 font-semibold text-primary">
                {formatDuration(selectedService.preparationMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tiempo total reservado</dt>
              <dd className="mt-1 font-semibold text-primary">
                {formatDuration(selectedService.blockDurationMinutes)}
              </dd>
            </div>
          </dl>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="appointment-date">
            Fecha
          </label>
          <input
            className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            id="appointment-date"
            min={minDate}
            name="dateKey"
            onChange={handleChange}
            required
            type="date"
            value={appointment.dateKey}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted" htmlFor="appointment-time">
            Horario
          </label>
          <select
            className="w-full rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!availabilityReady}
            id="appointment-time"
            name="time"
            onChange={handleChange}
            required
            value={appointment.time}
          >
            <option value="">
              {availabilityLoading ? 'Consultando disponibilidad' : 'Selecciona un horario'}
            </option>
            {timeOptions.map((bookingTime) => (
              <option
                disabled={bookingTime.disabled}
                key={bookingTime.value}
                value={bookingTime.value}
              >
                {bookingTime.label}
                {bookingTime.status ? ` · ${bookingTime.status}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {availabilityError && (
        <p className="mt-4 rounded-2xl border border-error/20 bg-error/10 p-3 text-sm text-error" role="alert">
          {availabilityError}
        </p>
      )}
    </section>
  );
}
