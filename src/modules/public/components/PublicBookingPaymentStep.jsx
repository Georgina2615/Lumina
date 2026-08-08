import { FiCreditCard, FiLock, FiShield } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatPublicPrice } from '../services/PublicBookingPolicy';

// Presenta el resumen previo al pago protegido
export default function PublicBookingPaymentStep({
  depositAmountCents,
  fields,
  onChange,
  service
}) {
  // Devuelve el paso financiero completo
  return (
    <section aria-labelledby="booking-payment-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Paso tres</p>
      <h2 className="mt-2 text-2xl sm:text-3xl" id="booking-payment-title">Paga tu anticipo</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Tu horario se reservará mientras completas el pago seguro.</p>

      <div className="mt-6 overflow-hidden rounded-3xl bg-primary text-surface shadow-xl shadow-primary/10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-surface/15 p-5 sm:p-7">
          <div>
            <p className="text-xs text-surface/60">Anticipo de {service?.name}</p>
            <p className="mt-1 font-title text-3xl font-semibold">{formatPublicPrice(depositAmountCents)}</p>
          </div>
          <span className="rounded-full bg-brand-gold/20 px-3 py-1.5 text-xs text-brand-gold">30 % del servicio</span>
        </div>
        <div className="grid gap-4 p-5 text-sm sm:grid-cols-2 sm:p-7">
          <div className="flex items-start gap-3"><FiCreditCard className="mt-0.5 text-brand-gold" aria-hidden="true" size={19} /><div><p className="font-semibold">Elige cómo pagar</p><p className="mt-1 text-xs leading-5 text-surface/65">Mercado Pago mostrará las opciones disponibles.</p></div></div>
          <div className="flex items-start gap-3"><FiShield className="mt-0.5 text-brand-gold" aria-hidden="true" size={19} /><div><p className="font-semibold">Datos protegidos</p><p className="mt-1 text-xs leading-5 text-surface/65">Lumina Skin no recibe ni guarda los datos de tu tarjeta.</p></div></div>
        </div>
      </div>

      <div className="mt-6 space-y-1 rounded-2xl border border-surface-hover bg-background p-2 sm:p-3">
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-sm leading-6 transition hover:bg-surface"><input checked={fields.privacyAccepted} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" onChange={(event) => onChange('privacyAccepted', event.target.checked)} type="checkbox" /><span>He leído el <Link className="font-semibold text-secondary underline" target="_blank" to="/aviso-privacidad">Aviso de privacidad</Link>.</span></label>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-sm leading-6 transition hover:bg-surface"><input checked={fields.termsAccepted} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" onChange={(event) => onChange('termsAccepted', event.target.checked)} type="checkbox" /><span>Acepto los <Link className="font-semibold text-secondary underline" target="_blank" to="/terminos-condiciones">Términos y condiciones</Link>.</span></label>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-sm leading-6 transition hover:bg-surface"><input checked={fields.cancellationAccepted} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" onChange={(event) => onChange('cancellationAccepted', event.target.checked)} type="checkbox" /><span>Acepto la <Link className="font-semibold text-secondary underline" target="_blank" to="/politica-cancelacion">Política de cancelación</Link>.</span></label>
      </div>

      <p className="mt-5 flex items-center gap-2 text-xs leading-5 text-muted"><FiLock aria-hidden="true" />Al continuar saldrás temporalmente de Lumina Skin para realizar el pago.</p>
    </section>
  );
}
