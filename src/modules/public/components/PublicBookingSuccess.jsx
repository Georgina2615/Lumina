import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiMessageCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

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
    <section className="py-6 text-center" aria-labelledby="public-payment-result">
      <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${content.iconClass}`}><StatusIcon className={normalizedStatus === 'checking' ? 'animate-spin' : ''} aria-hidden="true" size={30} /></span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">{content.eyebrow}</p>
      <h2 className="mt-3 text-4xl" id="public-payment-result">{content.title}</h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">{result?.message || content.description}</p>

      {(fields.dateKey || service?.name) && (
        <div className="mx-auto mt-7 max-w-lg rounded-2xl border border-surface-hover bg-background p-5 text-left text-sm">
          {service?.name && <p><span className="text-muted">Tratamiento</span><strong className="float-right">{service.name}</strong></p>}
          {fields.dateKey && <p className="mt-3"><span className="text-muted">Fecha y hora</span><strong className="float-right">{fields.dateKey} · {fields.time}</strong></p>}
        </div>
      )}

      {normalizedStatus !== 'checking' && (
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {['pending', 'rejected'].includes(normalizedStatus) && result?.checkoutUrl
            ? <a className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-surface" href={result.checkoutUrl}>Volver a Mercado Pago</a>
            : <Link className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-surface" to="/">Volver al inicio</Link>}
          <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-surface-hover px-6 text-sm font-semibold" href="https://wa.me/529811017687" rel="noreferrer" target="_blank"><FiMessageCircle aria-hidden="true" />Contactar por WhatsApp</a>
        </div>
      )}
    </section>
  );
}
