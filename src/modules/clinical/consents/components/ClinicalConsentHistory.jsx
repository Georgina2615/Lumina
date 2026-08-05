import { FiCheckCircle, FiImage } from 'react-icons/fi';
import ClinicalPrivatePhoto from '../../sessions/components/ClinicalPrivatePhoto';

// Presenta consentimientos anteriores sin permitir cambios
export default function ClinicalConsentHistory({ consents }) {
  if (consents.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
      <h2 className="text-xl text-primary">Consentimientos por cita</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {consents.map((consent) => (
          <article className="rounded-xl border border-surface-hover bg-background p-4" key={consent.appointmentId}>
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="font-semibold text-primary">{consent.serviceName}</h3><p className="text-xs text-muted">{consent.appointmentDate}</p></div>
              <span className="inline-flex items-center gap-1 rounded-full bg-status-confirmed/10 px-2.5 py-1 text-xs font-semibold text-status-confirmed"><FiCheckCircle aria-hidden="true" />Firmado</span>
            </div>
            <div className="mt-3 grid gap-1 text-xs text-muted">
              <span><FiImage aria-hidden="true" className="mr-1 inline" />Fotos clínicas {consent.clinicalPhotosAllowed ? 'autorizadas' : 'no autorizadas'}</span>
              <span>Fotos para publicidad {consent.marketingPhotosAllowed ? 'autorizadas' : 'no autorizadas'}</span>
            </div>
            {consent.signaturePath && <ClinicalPrivatePhoto alt={`Firma de consentimiento del ${consent.appointmentDate}`} className="mt-3 h-24 w-full rounded-lg bg-white object-contain" imagePath={consent.signaturePath} />}
          </article>
        ))}
      </div>
    </section>
  );
}
