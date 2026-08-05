import { FiX } from 'react-icons/fi';
import { formatCashCloseCurrency } from '../services/AdminCashClosePolicy';

// Confirma los importes antes de guardar
export default function CashCloseConfirmDialog({
  isCorrection,
  isSaving,
  onCancel,
  onConfirm,
  preview
}) {
  if (!preview) return null;
  const difference = preview.differenceCents;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div aria-modal="true" className="w-full max-w-md rounded-2xl bg-surface shadow-2xl" role="dialog">
        <div className="flex items-start justify-between border-b border-surface-hover p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">Corte diario</p>
            <h2 className="mt-1 text-2xl text-primary">Confirmar {isCorrection ? 'corrección' : 'corte'}</h2>
          </div>
          <button aria-label="Cerrar" className="rounded-lg p-2 text-muted hover:bg-background" onClick={onCancel} type="button">
            <FiX aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="flex justify-between gap-4 rounded-xl bg-background p-3">
            <span className="text-sm text-muted">Dinero esperado</span>
            <strong>{formatCashCloseCurrency(preview.expectedCashCents)}</strong>
          </div>
          <div className="flex justify-between gap-4 rounded-xl bg-background p-3">
            <span className="text-sm text-muted">Diferencia</span>
            <strong className={difference === 0 ? 'text-status-confirmed' : 'text-error'}>
              {formatCashCloseCurrency(difference)}
            </strong>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-surface-hover p-5">
          <button className="min-h-11 rounded-xl border border-surface-hover px-4 font-semibold" disabled={isSaving} onClick={onCancel} type="button">
            Regresar
          </button>
          <button className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-surface disabled:opacity-50" disabled={isSaving} onClick={onConfirm} type="button">
            {isSaving ? 'Guardando' : isCorrection ? 'Guardar corrección' : 'Guardar corte'}
          </button>
        </div>
      </div>
    </div>
  );
}
