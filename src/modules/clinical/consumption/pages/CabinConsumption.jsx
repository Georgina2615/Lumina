import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import CabinConsumptionItems from '../components/CabinConsumptionItems';
import CabinSupplyPicker from '../components/CabinSupplyPicker';
import { useCabinConsumption } from '../hooks/UseCabinConsumption';

// Presenta el registro de insumos utilizados por cita
export default function CabinConsumption() {
  const { appointmentId = '', clientId = '' } = useParams();
  const consumption = useCabinConsumption({ appointmentId, clientId });

  if (consumption.isLoading) return <div aria-label="Cargando insumos" className="mx-auto h-96 w-full max-w-6xl animate-pulse rounded-2xl border border-surface-hover bg-surface" role="status" />;
  if (!consumption.data) return (
    <div className="mx-auto flex min-h-80 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
      <h1 className="text-2xl text-primary">No pudimos abrir los insumos utilizados</h1><p className="mt-2 text-sm text-error">{consumption.error}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3"><Link className="inline-flex min-h-11 items-center rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary" to={`/dashboard/clinical/seguimiento/${clientId}/${appointmentId}`}>Abrir seguimiento</Link><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={consumption.reload} type="button"><FiRefreshCw aria-hidden="true" />Reintentar</button></div>
    </div>
  );

  if (consumption.data.consumption) return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-status-confirmed/30 bg-status-confirmed/10 p-8 text-center shadow-sm">
      <FiCheck aria-hidden="true" className="mx-auto size-8 text-status-confirmed" /><h1 className="mt-4 text-3xl text-primary">Insumos registrados</h1><p className="mt-2 text-sm text-muted">El inventario interno ya refleja lo utilizado en esta atención</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-surface-hover bg-surface px-5 text-sm font-semibold text-primary transition hover:border-secondary/30" to={`/dashboard/clinical/seguimiento/${clientId}/${appointmentId}`}>Volver al seguimiento</Link>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-surface transition hover:bg-secondary" to={`/dashboard/clinical/recomendaciones/${clientId}/${appointmentId}`}>Continuar a recomendaciones</Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-8">
      <header><p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Control de cabina</p><h1 className="mt-1 text-3xl text-primary sm:text-4xl">Insumos utilizados</h1><p className="mt-2 text-sm text-muted">{consumption.data.client.name} · {consumption.data.appointment.service}</p></header>
      <div className="grid gap-5 lg:grid-cols-2"><CabinSupplyPicker onAdd={consumption.addSupply} onSearch={consumption.setSearch} search={consumption.search} supplies={consumption.availableSupplies} /><CabinConsumptionItems items={consumption.selectedItems} onChange={consumption.changeQuantity} onRemove={consumption.removeSupply} /></div>
      {consumption.error && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{consumption.error}</div>}
      <footer className="flex justify-end"><button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:opacity-50" disabled={consumption.isSaving} onClick={consumption.save} type="button"><FiCheck aria-hidden="true" />{consumption.isSaving ? 'Registrando' : 'Registrar insumos utilizados'}</button></footer>
    </div>
  );
}
