import { FiFileText, FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import ClinicalSessionForm from '../components/ClinicalSessionForm';
import ClinicalSessionHeader from '../components/ClinicalSessionHeader';
import { useClinicalSession } from '../hooks/UseClinicalSession';

// Presenta la hoja vinculada con la sesión en cabina
export default function ClinicalSession() {
  const { appointmentId = '', clientId = '' } = useParams();
  const clinicalSession = useClinicalSession({ appointmentId, clientId });

  if (clinicalSession.isLoading) {
    return <div aria-label="Cargando seguimiento" className="mx-auto h-96 w-full max-w-7xl animate-pulse rounded-2xl border border-surface-hover bg-surface" role="status" />;
  }

  if (!clinicalSession.data) {
    const needsConsent = clinicalSession.error.includes('consentimiento');
    const recoveryPath = needsConsent
      ? `/dashboard/clinical/consentimiento/${clientId}/${appointmentId}`
      : `/dashboard/clinical/expediente/${clientId}/${appointmentId}`;
    return (
      <div className="mx-auto flex min-h-80 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <h1 className="text-2xl text-primary">No pudimos abrir el seguimiento</h1>
        <p className="mt-2 text-sm text-error">{clinicalSession.error}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover bg-surface px-4 text-sm font-semibold text-primary" to={recoveryPath}>
            <FiFileText aria-hidden="true" /> {needsConsent ? 'Abrir consentimiento' : 'Abrir ficha técnica'}
          </Link>
          <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={clinicalSession.reload} type="button">
            <FiRefreshCw aria-hidden="true" /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <ClinicalSessionHeader appointment={clinicalSession.data.appointment} client={clinicalSession.data.client} status={clinicalSession.data.status} />
      {clinicalSession.success && <div className="rounded-xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3 text-sm font-medium text-status-confirmed" role="status">{clinicalSession.success}</div>}
      {clinicalSession.data.status === 'completed' && <div className="flex justify-end"><Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-surface transition hover:bg-secondary" to={`/dashboard/clinical/insumos/${clientId}/${appointmentId}`}>Registrar insumos utilizados</Link></div>}
      {clinicalSession.error && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{clinicalSession.error}</div>}
      <ClinicalSessionForm
        busy={clinicalSession.isSaving}
        initialSession={clinicalSession.data.session}
        initialStatus={clinicalSession.data.status}
        key={clinicalSession.data.revision}
        onSave={clinicalSession.save}
        photoAllowed={clinicalSession.data.photoAllowed}
        previousTreatment={clinicalSession.data.previousTreatment}
        recordStatus={clinicalSession.data.recordStatus}
      />
    </div>
  );
}
