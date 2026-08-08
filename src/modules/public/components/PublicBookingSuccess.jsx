import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMessageCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Define mensajes seguros para cada resultado
const statusContent = {
  approved: {
    eyebrow: 'Pago aprobado',
    title: 'Tu cita quedó registrada',
    description: 'El anticipo está confirmado y enviaremos la información de la cita a tu correo.',
    icon: FiCheckCircle,
    iconClass: 'bg-status-confirmed/15 text-status-confirmed'
  },
  pending: {
    eyebrow: 'Pago pendiente',
    title: 'Estamos esperando la confirmación',
    description: 'Tu horario permanece reservado mientras Mercado Pago actualiza el resultado.',
    icon: FiClock,
    iconClass: 'bg-status-pending/20 text-secondary'
  },
  rejected: {
    eyebrow: 'Pago no completado',
    title: 'No se realizó ningún cobro',
    description: 'Puedes volver a Mercado Pago e intentar con otra opción.',
    icon: FiAlertCircle,
    iconClass: 'bg-error/10 text-error'
  },
  needs_attention: {
    eyebrow: 'Pago recibido',
    title: 'Necesitamos revisar tu horario',
    description: 'Conserva esta pantalla y comunícate con Lumina Skin para ayudarte.',
    icon: FiAlertCircle,
    iconClass: 'bg-status-pending/20 text-secondary'
  },
  error: {
    eyebrow: 'No pudimos consultar el pago',
    title: 'Tu pago no se ha perdido',
    description: 'Comunícate con Lumina Skin para que podamos comprobarlo.',
    icon: FiAlertCircle,
    iconClass: 'bg-error/10 text-error'
  },
  checking: {
    eyebrow: 'Comprobando pago',
    title: 'Espera un momento',
    description: 'Estamos consultando el resultado directamente con Mercado Pago.',
    icon: FiLoader,
    iconClass: 'bg-background text-secondary'
  }
};

// Presenta la fecha local sin formato tecnico
const formatAppointmentDate = ({ dateKey, time }) => {
  const [year, month, day] = String(dateKey).split('-').map(Number);
  const validDate = Number.isInteger(year) && Number.isInteger(month) && Number.isInteger(day);

  // Conserva los datos originales cuando la fecha no es valida
  if (!validDate) {
    return [dateKey, time].filter(Boolean).join(' · ');
  }

  const formattedDate = new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long'
  }).format(new Date(year, month - 1, day, 12));

  // Devuelve la fecha junto a la hora confirmada
  return time ? `${formattedDate} a las ${time}` : formattedDate;
};

// Presenta el resultado real del pago
export default function PublicBookingSuccess({ fields, result, service }) {
  const normalizedStatus = ['pending_payment', 'payment_pending'].includes(result?.status)
    ? 'pending'
    : result?.status === 'payment_needs_attention'
      ? 'needs_attention'
      : result?.status === 'payment_rejected'
        ? 'rejected'
        : result?.status ?? 'checking';
  const content = statusContent[normalizedStatus] ?? statusContent.error;
  const StatusIcon = content.icon;

  // Devuelve la confirmacion correspondiente
  return (
    <section aria-labelledby="public-payment-result" aria-live="polite" className="py-4 text-center sm:py-6">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${content.iconClass}`}><StatusIcon className={normalizedStatus === 'checking' ? 'animate-spin' : ''} aria-hidden="true" size={30} /></span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{content.eyebrow}</p>
      <h2 className="mt-3 text-4xl" id="public-payment-result">{content.title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">{result?.message || content.description}</p>

      {(fields.dateKey || service?.name) && (
        <div className="mx-auto mt-7 max-w-lg divide-y divide-surface-hover rounded-2xl border border-surface-hover bg-background px-5 text-left text-sm">
          {service?.name && <p className="flex items-start justify-between gap-4 py-4"><span className="text-muted">Tratamiento</span><strong className="text-right">{service.name}</strong></p>}
          {fields.dateKey && <p className="flex items-start justify-between gap-4 py-4"><span className="shrink-0 text-muted">Fecha y hora</span><strong className="text-right">{formatAppointmentDate(fields)}</strong></p>}
        </div>
      )}

      {normalizedStatus !== 'checking' && (
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {['pending', 'rejected'].includes(normalizedStatus) && result?.checkoutUrl
            ? <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-surface transition hover:bg-secondary active:scale-[0.98]" href={result.checkoutUrl}>Volver a Mercado Pago</a>
            : <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-surface transition hover:bg-secondary active:scale-[0.98]" to="/">Volver al inicio</Link>}
          <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover px-6 text-sm font-semibold transition hover:bg-background active:scale-[0.98]" href="https://wa.me/529811017687" rel="noreferrer" target="_blank"><FiMessageCircle aria-hidden="true" />Contactar por WhatsApp</a>
        </div>
      )}
    </section>
  );
}
