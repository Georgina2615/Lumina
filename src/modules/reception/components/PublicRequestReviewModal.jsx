import { useEffect, useState } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { formatCurrency } from '../services/SaleCalculationService';

// Presenta la revisión completa de una solicitud
export default function PublicRequestReviewModal({
  request,
  error,
  isSubmitting,
  loadProof,
  onApprove,
  onClose,
  onReject
}) {
  const [proofUrl, setProofUrl] = useState('');
  const [proofError, setProofError] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    loadProof(request.proof.path)
      .then((file) => {
        objectUrl = URL.createObjectURL(file);
        if (active) {
          setProofUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
          objectUrl = '';
        }
      })
      .catch(() => active && setProofError('No pudimos abrir el comprobante'));
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [loadProof, request.proof.path]);

  // Envía el rechazo con su motivo
  const submitRejection = async () => {
    if (reason.trim().length < 3) {
      setReasonError('Escribe el motivo del rechazo');
      return;
    }
    setReasonError('');
    await onReject(reason.trim());
  };

  return (
    <div aria-modal="true" className="fixed inset-0 z-50 flex items-end justify-center bg-primary/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog">
      <div className="max-h-[95dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-surface-hover bg-background px-5 py-4 sm:px-7">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">
              Solicitud por internet
            </p>
            <h2 className="font-title text-2xl font-bold text-primary">
              Revisar anticipo
            </h2>
          </div>
          <button aria-label="Cerrar" className="rounded-lg p-2 text-muted transition hover:bg-surface-hover" disabled={isSubmitting} onClick={onClose} type="button">
            <FiX aria-hidden="true" size={22} />
          </button>
        </header>

        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1fr_0.9fr]">
          <section>
            <div className="overflow-hidden rounded-2xl border border-surface-hover bg-surface">
              {proofUrl ? (
                <img alt={`Comprobante de ${request.client.fullName}`} className="max-h-[420px] w-full object-contain" src={proofUrl} />
              ) : (
                <div className="flex min-h-64 items-center justify-center p-6 text-center text-sm text-muted">
                  {proofError || 'Cargando comprobante'}
                </div>
              )}
            </div>
            <p className="mt-2 break-all text-xs text-muted">
              Folio {request.proof.paymentReference}
            </p>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="font-title text-xl font-bold text-primary">
                {request.client.fullName}
              </h3>
              <p className="mt-1 text-sm text-muted">{request.client.phone}</p>
              <p className="break-all text-sm text-muted">{request.client.email}</p>
            </div>
            <div className="rounded-2xl bg-surface p-4 text-sm">
              <p className="font-semibold text-primary">{request.service.name}</p>
              <p className="mt-1 text-muted">
                {request.schedule.dateKey} a las {request.schedule.time}
              </p>
              <div className="mt-3 flex justify-between border-t border-surface-hover pt-3">
                <span className="text-muted">Anticipo</span>
                <strong>{formatCurrency(request.service.depositAmountCents)}</strong>
              </div>
            </div>

            {showReject && (
              <label className="block text-sm font-semibold text-primary">
                Motivo del rechazo
                <textarea className="mt-2 min-h-24 w-full rounded-xl border border-surface-hover bg-background p-3 font-normal outline-none transition focus:border-secondary" maxLength={300} onChange={(event) => {
                  setReason(event.target.value);
                  setReasonError('');
                }} placeholder="Explica por qué no se aprobó" value={reason} />
                {reasonError && (
                  <span className="mt-1 block text-xs font-normal text-error">
                    {reasonError}
                  </span>
                )}
              </label>
            )}
            {error && <p className="rounded-xl bg-error/10 p-3 text-sm text-error" role="alert">{error}</p>}

            <div className="grid gap-2 sm:grid-cols-2">
              <button className="min-h-11 rounded-xl border border-error/30 px-4 font-semibold text-error transition hover:bg-error/10 disabled:opacity-50" disabled={isSubmitting} onClick={showReject ? submitRejection : () => setShowReject(true)} type="button">
                {showReject ? 'Confirmar rechazo' : 'Rechazar'}
              </button>
              <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 font-semibold text-surface transition hover:bg-primary/90 disabled:opacity-50" disabled={isSubmitting || !proofUrl} onClick={onApprove} type="button">
                <FiCheck aria-hidden="true" />
                {isSubmitting ? 'Guardando' : 'Aprobar cita'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
