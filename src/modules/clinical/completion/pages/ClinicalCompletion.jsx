import { FiArrowRight, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import ClinicalCompletionChecklist from '../components/ClinicalCompletionChecklist';
import { useClinicalCompletion } from '../hooks/UseClinicalCompletion';

// Presenta el cierre y entrega de la atención
export default function ClinicalCompletion() {
  const { appointmentId = '', clientId = '' } = useParams();
  const completion = useClinicalCompletion({ appointmentId, clientId });

  if (completion.isLoading) return <div aria-label="Verificando atención" className="mx-auto h-96 w-full max-w-3xl animate-pulse rounded-2xl border border-surface-hover bg-surface" role="status" />;
  if (completion.success) {
    return <div className="mx-auto flex min-h-96 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-status-confirmed/30 bg-status-confirmed/5 p-6 text-center"><FiCheckCircle aria-hidden="true" className="text-4xl text-status-confirmed" /><h1 className="mt-4 text-3xl text-primary">Atención enviada a recepción</h1><p className="mt-2 text-sm text-muted">La cita ya está disponible para cobrar</p><Link className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface" to="/dashboard/clinical">Volver a mi agenda <FiArrowRight aria-hidden="true" /></Link></div>;
  }
  if (!completion.data) {
    return <div className="mx-auto flex min-h-80 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center"><h1 className="text-2xl text-primary">No pudimos verificar la atención</h1><p className="mt-2 text-sm text-error">{completion.error}</p><button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={completion.reload} type="button"><FiRefreshCw aria-hidden="true" /> Reintentar</button></div>;
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 pb-6">
      <header><p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Cierre de atención</p><h1 className="mt-1 text-3xl text-primary sm:text-4xl">Enviar a recepción</h1><p className="mt-2 text-sm text-muted">{completion.data.client.name} · {completion.data.appointment.service}</p></header>
      {completion.error && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{completion.error}</div>}
      <ClinicalCompletionChecklist requirements={completion.data.requirements} />
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted">La cita aparecerá en Por cobrar cuando todos los puntos estén listos</p><button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50" disabled={!completion.data.ready || completion.isSaving} onClick={completion.complete} type="button">{completion.isSaving ? 'Enviando' : 'Terminar atención y enviar'} <FiArrowRight aria-hidden="true" /></button></div>
    </div>
  );
}
