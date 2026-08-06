import { FiCheckCircle, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Presenta el resultado sin prometer una cita confirmada
export default function PublicBookingSuccess({ fields, result, service }) {
  // Devuelve la confirmacion de recepcion
  return (
    <section className="py-6 text-center" aria-labelledby="public-request-success">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-status-confirmed/15 text-status-confirmed"><FiCheckCircle aria-hidden="true" size={30} /></span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Solicitud recibida</p>
      <h2 className="mt-3 text-4xl" id="public-request-success">Recepción revisará tu transferencia</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">El horario quedó apartado mientras verificamos el comprobante. Recibirás un correo cuando la cita haya sido registrada.</p>
      <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-surface-hover bg-background p-5 text-left text-sm">
        <p><span className="text-muted">Tratamiento</span><strong className="float-right">{service?.name}</strong></p>
        <p className="mt-3"><span className="text-muted">Fecha y hora</span><strong className="float-right">{fields.dateKey} · {fields.time}</strong></p>
        <p className="mt-3"><span className="text-muted">Folio</span><strong className="float-right font-mono">{result?.requestId?.slice(0, 10).toUpperCase()}</strong></p>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-surface" to="/">Volver al inicio</Link>
        <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover px-6 text-sm font-semibold" href="https://wa.me/529811017687" rel="noreferrer" target="_blank"><FiMessageCircle aria-hidden="true" />Contactar por WhatsApp</a>
      </div>
    </section>
  );
}
