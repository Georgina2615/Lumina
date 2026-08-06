import { getBusinessDateKey } from '../../../shared/services/AppointmentSchedulePolicy';

// Comparte los estilos de captura del formulario
const inputClassName = 'mt-2 min-h-12 w-full rounded-xl border border-surface-hover bg-background px-4 text-sm text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:ring-2 focus:ring-secondary/15';

// Presenta los datos y horarios disponibles
export default function PublicBookingDetailsStep({
  availabilityLoading,
  fields,
  onChange,
  timeOptions
}) {
  // Devuelve la captura publica obligatoria
  return (
    <section aria-labelledby="booking-details-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Paso dos</p>
      <h2 className="mt-2 text-3xl" id="booking-details-title">Datos y horario</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Usaremos estos datos para identificar tu solicitud y comunicarnos contigo.</p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold text-muted sm:col-span-2">Nombre completo
          <input autoComplete="name" className={inputClassName} maxLength="150" onChange={(event) => onChange('fullName', event.target.value)} placeholder="Nombre y apellidos" value={fields.fullName} />
        </label>
        <label className="text-xs font-semibold text-muted">Teléfono
          <input autoComplete="tel" className={inputClassName} inputMode="numeric" maxLength="10" onChange={(event) => onChange('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Diez dígitos" value={fields.phone} />
        </label>
        <label className="text-xs font-semibold text-muted">Correo electrónico
          <input autoComplete="email" className={inputClassName} maxLength="254" onChange={(event) => onChange('email', event.target.value)} placeholder="nombre@correo.com" type="email" value={fields.email} />
        </label>
        <label className="text-xs font-semibold text-muted">Fecha
          <input className={inputClassName} min={getBusinessDateKey()} onChange={(event) => onChange('dateKey', event.target.value)} type="date" value={fields.dateKey} />
        </label>
        <label className="text-xs font-semibold text-muted">Horario
          <select className={inputClassName} disabled={!fields.dateKey || availabilityLoading} onChange={(event) => onChange('time', event.target.value)} value={fields.time}>
            <option value="">{availabilityLoading ? 'Consultando horarios' : 'Selecciona un horario'}</option>
            {timeOptions.map((option) => <option disabled={option.disabled} key={option.value} value={option.value}>{option.label} · {option.status}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-5 rounded-2xl bg-status-pending/15 px-4 py-3 text-xs leading-5 text-muted">Las solicitudes por internet deben enviarse al menos dos horas antes de la cita.</p>
    </section>
  );
}
