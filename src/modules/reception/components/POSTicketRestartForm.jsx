import { useState } from 'react';
import { FiChevronDown, FiRefreshCw } from 'react-icons/fi';

// Presenta la autorización administrativa de nuevos intentos
export default function POSTicketRestartForm({ processing, saleId, onRestart }) {
  const [expanded, setExpanded] = useState(false);
  const [reason, setReason] = useState('');
  const normalizedReason = reason.trim();
  const fieldId = `ticket-restart-reason-${saleId}`;

  // Envía únicamente un motivo suficiente
  const handleSubmit = (event) => {
    event.preventDefault();
    if (normalizedReason.length < 10 || processing) return;
    onRestart(normalizedReason);
  };

  if (!expanded) return (
    <button className="mt-2 inline-flex w-full min-h-10 items-center justify-center gap-2 rounded-lg border border-secondary/30 bg-secondary/5 px-3 text-xs font-bold text-primary transition hover:bg-secondary/10" disabled={processing} onClick={() => setExpanded(true)} type="button">
      <FiChevronDown aria-hidden="true" /> Habilitar nuevos intentos
    </button>
  );

  return (
    <form className="mt-3 rounded-xl border border-secondary/25 bg-background p-3" onSubmit={handleSubmit}>
      <label className="text-xs font-semibold text-primary" htmlFor={fieldId}>Motivo de la autorización</label>
      <textarea className="mt-2 min-h-20 w-full resize-y rounded-lg border border-surface-hover bg-surface px-3 py-2 text-sm text-primary outline-none transition focus:border-secondary" id={fieldId} maxLength={300} onChange={(event) => setReason(event.target.value)} placeholder="Ejemplo Se corrigió la configuración del correo" value={reason} />
      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <button className="min-h-10 rounded-lg border border-surface-hover px-3 text-xs font-semibold text-primary" disabled={processing} onClick={() => setExpanded(false)} type="button">Cancelar</button>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-surface disabled:opacity-50" disabled={processing || normalizedReason.length < 10} type="submit"><FiRefreshCw aria-hidden="true" />{processing ? 'Habilitando' : 'Permitir tres intentos'}</button>
      </div>
    </form>
  );
}
