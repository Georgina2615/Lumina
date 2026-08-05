import { useRef, useState } from 'react';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import { Link, useParams } from 'react-router-dom';
import ClinicalConsentPhotoChoices from '../components/ClinicalConsentPhotoChoices';
import ClinicalConsentSignature from '../components/ClinicalConsentSignature';
import ClinicalConsentStatements from '../components/ClinicalConsentStatements';
import { useClinicalConsent } from '../hooks/UseClinicalConsent';

// Presenta y firma el consentimiento de una cita
export default function ClinicalConsent() {
  const { appointmentId = '', clientId = '' } = useParams();
  const consent = useClinicalConsent({ appointmentId, clientId });
  const signatureRef = useRef(null);
  const [acceptedIds, setAcceptedIds] = useState([]);
  const [choices, setChoices] = useState({ clinical: false, marketing: false });
  const [validationError, setValidationError] = useState('');

  if (consent.isLoading) return <div aria-label="Cargando consentimiento" className="mx-auto h-96 w-full max-w-5xl animate-pulse rounded-2xl border border-surface-hover bg-surface" role="status" />;
  if (!consent.data) return (
    <div className="mx-auto flex min-h-80 w-full max-w-3xl flex-col items-center justify-center rounded-2xl border border-error/20 bg-error/5 p-6 text-center">
      <h1 className="text-2xl text-primary">No pudimos abrir el consentimiento</h1>
      <p className="mt-2 text-sm text-error">{consent.error}</p>
      <button className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface" onClick={consent.reload} type="button"><FiRefreshCw aria-hidden="true" /> Reintentar</button>
    </div>
  );

  const { appointment, client, template } = consent.data;
  const toggleStatement = (id) => setAcceptedIds((current) => (
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  ));
  const submit = async () => {
    if (acceptedIds.length !== template.statements.length) return setValidationError('Acepta todas las declaraciones obligatorias');
    if (!signatureRef.current || signatureRef.current.isEmpty()) return setValidationError('Solicita la firma de la clienta');
    setValidationError('');
    return consent.sign({
      canvas: signatureRef.current.getCanvas(),
      choices,
      statementIds: acceptedIds
    });
  };

  if (consent.data.consent?.status === 'signed') return (
    <div className="mx-auto w-full max-w-3xl rounded-3xl border border-status-confirmed/30 bg-status-confirmed/10 p-6 text-center shadow-sm sm:p-10">
      <FiCheck aria-hidden="true" className="mx-auto size-8 text-status-confirmed" />
      <h1 className="mt-4 text-3xl text-primary">Consentimiento firmado</h1>
      <p className="mt-2 text-sm text-muted">{client.name} autorizó el tratamiento de esta cita</p>
      <Link className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-surface" to={`/dashboard/clinical/seguimiento/${clientId}/${appointmentId}`}>Abrir seguimiento</Link>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 pb-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">Consentimiento clínico</p>
        <h1 className="mt-1 text-3xl text-primary sm:text-4xl">{template.title}</h1>
        <p className="mt-2 text-sm text-muted">{client.name} · {appointment.service} · {appointment.date} {appointment.time}</p>
      </header>
      <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
        <ClinicalConsentStatements acceptedIds={acceptedIds} onToggle={toggleStatement} statements={template.statements} />
      </section>
      <ClinicalConsentPhotoChoices choices={choices} onChange={(field, value) => setChoices((current) => ({ ...current, [field]: value }))} />
      <ClinicalConsentSignature disabled={consent.isSaving} onClear={() => signatureRef.current?.clear()} ref={signatureRef} />
      <section className="rounded-2xl border border-surface-hover bg-background p-4 text-sm text-muted">
        <p className="font-semibold text-primary">{template.responsible.name}</p>
        <p>{template.responsible.email} · {template.responsible.phone}</p>
        <p>{template.responsible.address}</p>
      </section>
      {(validationError || consent.error) && <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{validationError || consent.error}</div>}
      <footer className="flex justify-end">
        <button className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:opacity-50" disabled={consent.isSaving} onClick={submit} type="button"><FiCheck aria-hidden="true" /> {consent.isSaving ? 'Guardando firma' : 'Firmar consentimiento'}</button>
      </footer>
    </div>
  );
}
