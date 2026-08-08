import { useState } from 'react';
import SettingsDialogShell from '../../../settings/components/SettingsDialogShell';
import {
  ADMIN_INVOICE_STATUS_LABELS,
  formatAdminInvoiceCurrency,
  formatAdminInvoiceDate,
  formatInvoiceUse,
  formatTaxRegime
} from '../services/AdminInvoicePolicy';

const Detail = ({ label, value }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
    <dd className="mt-1 break-words text-sm font-medium text-primary">{value}</dd>
  </div>
);

// Presenta los datos privados y la siguiente acción
export default function AdminInvoiceDetailsModal({
  error,
  isSaving,
  onClose,
  onSubmit,
  request
}) {
  const [fiscalFolio, setFiscalFolio] = useState(request?.fiscalFolio ?? '');
  const [note, setNote] = useState(request?.note ?? '');

  if (!request) return null;
  const canPrepare = request.status === 'pendiente';
  const canDeliver = request.status === 'preparada';
  const hasAction = canPrepare || canDeliver;

  return (
    <SettingsDialogShell
      busy={isSaving}
      description={`${request.saleFolio} · ${formatAdminInvoiceCurrency(request.totalAmountCents)}`}
      eyebrow="Solicitud de factura"
      focusKey={request.id}
      onClose={onClose}
      title={request.fiscalData.taxpayerName}
      wide
    >
      <div className="space-y-5 p-5 sm:p-6">
        <dl className="grid gap-4 rounded-2xl border border-surface-hover bg-surface p-4 sm:grid-cols-2">
          <Detail label="RFC" value={request.fiscalData.taxId} />
          <Detail label="Código postal fiscal" value={request.fiscalData.postalCode} />
          <Detail label="Régimen fiscal" value={formatTaxRegime(request.fiscalData.taxRegime)} />
          <Detail label="Uso de factura" value={formatInvoiceUse(request.fiscalData.invoiceUse)} />
          <Detail label="Correo de entrega" value={request.fiscalData.deliveryEmail} />
          <Detail label="Solicitada" value={formatAdminInvoiceDate(request.requestedAt)} />
          <Detail label="Estado" value={ADMIN_INVOICE_STATUS_LABELS[request.status]} />
          {request.fiscalFolio && <Detail label="Folio o referencia" value={request.fiscalFolio} />}
        </dl>

        {canPrepare && (
          <label className="block text-sm font-semibold text-muted">
            Folio o referencia de la factura
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              maxLength={100}
              onChange={(event) => setFiscalFolio(event.target.value)}
              placeholder="Ejemplo FACTURA 001"
              value={fiscalFolio}
            />
          </label>
        )}

        {hasAction && (
          <label className="block text-sm font-semibold text-muted">
            Nota opcional
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-xl border border-surface-hover bg-background p-3 text-primary outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
              value={note}
            />
          </label>
        )}

        {error && <p className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error" role="alert">{error}</p>}

        <footer className="flex flex-wrap justify-end gap-3 border-t border-surface-hover pt-4">
          <button className="min-h-11 rounded-xl border border-surface-hover px-5 font-semibold text-primary" disabled={isSaving} onClick={onClose} type="button">
            Cerrar
          </button>
          {hasAction && (
            <button
              className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSaving || (canPrepare && fiscalFolio.trim().length < 3)}
              onClick={() => onSubmit({ fiscalFolio: fiscalFolio.trim(), note: note.trim() })}
              type="button"
            >
              {isSaving ? 'Guardando' : canPrepare ? 'Marcar como preparada' : 'Marcar como atendida'}
            </button>
          )}
        </footer>
      </div>
    </SettingsDialogShell>
  );
}
