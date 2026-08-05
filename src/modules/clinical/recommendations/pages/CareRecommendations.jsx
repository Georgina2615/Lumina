import { FiRefreshCw, FiSave } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import CareProductPicker from '../components/CareProductPicker';
import CareRecommendationFields from '../components/CareRecommendationFields';
import { useCareRecommendation } from '../hooks/UseCareRecommendation';

// Presenta recomendaciones de cuidado por cita
export default function CareRecommendations() {
  const { appointmentId = '', clientId = '' } = useParams();
  const care = useCareRecommendation({ appointmentId, clientId });

  if (care.isLoading) return <div aria-label="Cargando recomendaciones" className="mx-auto h-96 w-full max-w-7xl animate-pulse rounded-2xl border border-surface-hover bg-surface" role="status" />;
  if (!care.data) {
    return (
      <div className="mx-auto flex min-h-80 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <h1 className="text-2xl text-primary">No pudimos abrir las recomendaciones</h1><p className="mt-2 text-sm text-error">{care.error}</p>
        <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={care.reload} type="button"><FiRefreshCw aria-hidden="true" /> Reintentar</button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <header><p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Atención en cabina</p><h1 className="mt-1 text-3xl text-primary sm:text-4xl">Recomendaciones de cuidado</h1><p className="mt-2 text-sm text-muted">{care.data.client.name} · {care.data.appointment.service}</p></header>
      {care.success && <div className="rounded-xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3 text-sm font-medium text-status-confirmed" role="status">{care.success}</div>}
      {care.error && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{care.error}</div>}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <CareProductPicker onSearch={care.setSearch} onToggle={care.toggleProduct} products={care.products} search={care.search} selectedIds={care.selectedProductIds} />
        <CareRecommendationFields fields={care.fields} onChange={care.changeField} services={care.data.services} />
      </div>
      <footer className="flex flex-wrap justify-end gap-3">{care.success && <Link className="inline-flex min-h-12 items-center rounded-xl border border-surface-hover bg-surface px-6 text-sm font-semibold text-primary" to={`/dashboard/clinical/finalizar/${clientId}/${appointmentId}`}>Revisar cierre de atención</Link>}<button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:opacity-50" disabled={care.isSaving} onClick={care.save} type="button"><FiSave aria-hidden="true" /> {care.isSaving ? 'Guardando' : 'Guardar recomendaciones'}</button></footer>
    </div>
  );
}
