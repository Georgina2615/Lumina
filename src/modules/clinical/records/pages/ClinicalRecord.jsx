import { FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../auth/context';
import ClinicalRecordForm from '../components/ClinicalRecordForm';
import ClinicalRecordHeader from '../components/ClinicalRecordHeader';
import { useClinicalRecord } from '../hooks/UseClinicalRecord';

// Presenta la ficha técnica vinculada con una cita
export default function ClinicalRecord() {
  const { appointmentId = '', clientId = '' } = useParams();
  const { usuario: user } = useAuth();
  const clinicalRecord = useClinicalRecord({ appointmentId, clientId });
  const cosmetologistName = user?.displayName || user?.email?.split('@')[0] || 'Cosmetóloga';

  if (clinicalRecord.isLoading) {
    return <div aria-label="Cargando ficha técnica" className="mx-auto h-96 w-full max-w-7xl animate-pulse rounded-2xl border border-surface-hover bg-surface" role="status" />;
  }

  if (!clinicalRecord.data) {
    return (
      <div className="mx-auto flex min-h-80 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
        <h1 className="text-2xl text-primary">No pudimos abrir la ficha</h1>
        <p className="mt-2 text-sm text-error">{clinicalRecord.error}</p>
        <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={clinicalRecord.reload} type="button">
          <FiRefreshCw aria-hidden="true" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <ClinicalRecordHeader client={clinicalRecord.data.client} cosmetologistName={cosmetologistName} status={clinicalRecord.data.status} />

      {clinicalRecord.success && <div className="rounded-xl border border-status-confirmed/30 bg-status-confirmed/10 px-4 py-3 text-sm font-medium text-status-confirmed" role="status">{clinicalRecord.success}</div>}
      {clinicalRecord.error && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{clinicalRecord.error}</div>}
      {clinicalRecord.data.status === 'completed' && (
        <div className="flex justify-end">
          <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-surface transition hover:bg-secondary" to={`/dashboard/clinical/consentimiento/${clientId}/${appointmentId}`}>
            Continuar al consentimiento
          </Link>
        </div>
      )}

      <ClinicalRecordForm
        busy={clinicalRecord.isSaving}
        initialRecord={clinicalRecord.data.record}
        initialStatus={clinicalRecord.data.status}
        key={clinicalRecord.data.revision}
        onSave={clinicalRecord.save}
      />
    </div>
  );
}
