import { useState } from 'react';
import { FiCheck, FiCopy, FiImage, FiUploadCloud } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { formatPublicPrice } from '../services/PublicBookingPolicy';

// Formatea la clabe para facilitar su lectura
const formatClabe = (clabe) => clabe.replace(/(.{3})/g, '$1 ').trim();

// Presenta transferencia comprobante y autorizaciones
export default function PublicBookingPaymentStep({
  config,
  configError,
  depositAmountCents,
  fields,
  onChange,
  onProof,
  processingProof,
  service
}) {
  const [copied, setCopied] = useState(false);

  // Copia la clabe confirmada por la titular
  const copyClabe = async () => {
    await navigator.clipboard.writeText(config.clabe);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // Devuelve el paso financiero completo
  return (
    <section aria-labelledby="booking-payment-title">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Paso tres</p>
      <h2 className="mt-2 text-3xl" id="booking-payment-title">Realiza el anticipo</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Transfiere el treinta por ciento y adjunta tu comprobante para que recepción pueda revisarlo.</p>

      <div className="mt-7 rounded-3xl bg-primary p-6 text-surface sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-surface/15 pb-5">
          <div><p className="text-xs text-surface/60">{service?.name}</p><p className="mt-1 font-title text-3xl font-semibold">{formatPublicPrice(depositAmountCents)}</p></div>
          <span className="rounded-full bg-status-pending/20 px-3 py-1.5 text-xs text-status-pending">Anticipo del 30 %</span>
        </div>

        {config ? (
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-surface/55">Institución</dt><dd className="mt-1 font-semibold">{config.bankName}</dd></div>
            <div><dt className="text-xs text-surface/55">Beneficiaria</dt><dd className="mt-1 font-semibold">{config.beneficiaryName}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-surface/55">CLABE</dt><dd className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface/10 px-4 py-3"><span className="font-mono text-base tracking-wide">{formatClabe(config.clabe)}</span><button className="inline-flex items-center gap-2 text-xs text-status-pending" onClick={copyClabe} type="button">{copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}{copied ? 'Copiada' : 'Copiar'}</button></dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-surface/55">Concepto de pago</dt><dd className="mt-1 font-mono font-semibold text-status-pending">{fields.paymentReference}</dd></div>
          </dl>
        ) : <p className="mt-5 rounded-2xl bg-error/15 p-4 text-sm text-surface" role="alert">{configError || 'Consultando los datos de transferencia.'}</p>}
      </div>

      <label className="mt-6 flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-secondary/40 bg-status-pending/5 p-5 transition hover:bg-status-pending/10">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-status-pending/20 text-secondary">{fields.proofDataUrl ? <FiImage aria-hidden="true" size={21} /> : <FiUploadCloud aria-hidden="true" size={21} />}</span>
        <span className="min-w-0"><span className="block text-sm font-semibold">{processingProof ? 'Preparando imagen' : fields.proofName || 'Seleccionar comprobante'}</span><span className="mt-1 block text-xs text-muted">JPG PNG o WebP de hasta ocho megabytes</span></span>
        <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={processingProof} onChange={(event) => onProof(event.target.files?.[0])} type="file" />
      </label>

      <div className="mt-6 space-y-3 rounded-2xl border border-surface-hover bg-background p-5">
        <label className="flex items-start gap-3 text-sm leading-6"><input checked={fields.privacyAccepted} className="mt-1 h-4 w-4 accent-primary" onChange={(event) => onChange('privacyAccepted', event.target.checked)} type="checkbox" /><span>He leído el <Link className="font-semibold text-secondary underline" target="_blank" to="/aviso-privacidad">Aviso de privacidad</Link>.</span></label>
        <label className="flex items-start gap-3 text-sm leading-6"><input checked={fields.termsAccepted} className="mt-1 h-4 w-4 accent-primary" onChange={(event) => onChange('termsAccepted', event.target.checked)} type="checkbox" /><span>Acepto los <Link className="font-semibold text-secondary underline" target="_blank" to="/terminos-condiciones">Términos y condiciones</Link>.</span></label>
        <label className="flex items-start gap-3 text-sm leading-6"><input checked={fields.cancellationAccepted} className="mt-1 h-4 w-4 accent-primary" onChange={(event) => onChange('cancellationAccepted', event.target.checked)} type="checkbox" /><span>Acepto la <Link className="font-semibold text-secondary underline" target="_blank" to="/politica-cancelacion">Política de cancelación</Link>.</span></label>
      </div>
    </section>
  );
}
