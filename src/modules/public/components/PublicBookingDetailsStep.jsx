import { getBusinessDateKey } from '../../../shared/services/AppointmentSchedulePolicy';
import { formatPublicPrice } from '../services/PublicBookingPolicy';

// Comparte los estilos de captura del formulario
const inputClassName = 'mt-2 min-h-12 w-full rounded-xl border border-surface-hover bg-background px-4 text-base text-primary outline-none transition placeholder:text-muted/55 focus:border-secondary focus:ring-2 focus:ring-secondary/15 sm:text-sm';

// Presenta los datos y horarios disponibles
export default function PublicBookingDetailsStep({
  availabilityLoading,
  fields,
  onChange,
  service,
  timeOptions
}) {
  // Devuelve la captura publica obligatoria
  return (
    <section aria-labelledby="booking-details-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Paso dos</p>
      <h2 className="mt-2 text-2xl sm:text-3xl" id="booking-details-title">Datos y horario</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Usaremos estos datos para identificar tu solicitud y comunicarnos contigo.</p>

      {service && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-brand-gold/45 bg-brand-blush/30 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">Tratamiento elegido</p>
            <p className="mt-1 truncate text-sm font-semibold text-primary">{service.name}</p>
          </div>
          <p className="shrink-0 font-title text-lg font-semibold text-primary">{formatPublicPrice(service.priceCents)}</p>
        </div>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
      <p className="mt-5 rounded-2xl bg-brand-ivory px-4 py-3 text-xs leading-5 text-muted">Las solicitudes por internet deben enviarse al menos dos horas antes de la cita.</p>
    </section>
  );
}
