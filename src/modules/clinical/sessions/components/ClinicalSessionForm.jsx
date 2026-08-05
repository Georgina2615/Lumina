import { FiCheck, FiSave } from 'react-icons/fi';
import { ClinicalTextArea } from '../../records/components/ClinicalFormControls';
import { useClinicalSessionForm } from '../hooks/UseClinicalSessionForm';
import ClinicalSessionPhotoField from './ClinicalSessionPhotoField';

// Presenta la captura completa de una sesión
export default function ClinicalSessionForm({
  busy,
  initialSession,
  initialStatus,
  onSave,
  photoAllowed,
  previousTreatment,
  recordStatus
}) {
  const form = useClinicalSessionForm({
    initialSession,
    initialStatus,
    onSave,
    recordStatus
  });

  return (
    <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
      <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="text-xl text-primary">Antes de iniciar</h2>
        <div className="mt-4 rounded-xl bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tratamiento anterior</p>
          <p className="mt-1 font-semibold text-primary">{previousTreatment || 'Primera sesión registrada'}</p>
        </div>
        <div className="mt-4">
          <ClinicalTextArea
            hint="Si no observas cambios escribe Sin observaciones"
            label="Observaciones antes del tratamiento"
            maxLength={2000}
            onChange={(event) => form.changeField('beforeObservations', event.target.value)}
            value={form.session.beforeObservations}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
        <h2 className="text-xl text-primary">Tratamiento realizado</h2>
        <div className="mt-4 grid gap-4">
          <ClinicalTextArea
            hint="Puedes detallar productos técnicas o cambios realizados"
            label="Descripción del tratamiento"
            maxLength={1000}
            onChange={(event) => form.changeField('performedTreatment', event.target.value)}
            value={form.session.performedTreatment}
          />
          <ClinicalTextArea
            hint="Si no observas cambios escribe Sin observaciones"
            label="Observaciones después del tratamiento"
            maxLength={2000}
            onChange={(event) => form.changeField('afterObservations', event.target.value)}
            value={form.session.afterObservations}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
        <div>
          <h2 className="text-xl text-primary">Fotografías de seguimiento</h2>
          <p className="mt-1 text-sm text-muted">Las imágenes son privadas y solo puede consultarlas la cosmetóloga</p>
        </div>
        {photoAllowed ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ClinicalSessionPhotoField existingPath={form.session.photos.beforePath} kind="before" label="Fotografía anterior" onSelect={form.selectPhoto} preview={form.previews.before} />
            <ClinicalSessionPhotoField existingPath={form.session.photos.afterPath} kind="after" label="Fotografía posterior" onSelect={form.selectPhoto} preview={form.previews.after} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-surface-hover bg-background px-4 py-3 text-sm text-muted">La clienta no autorizó fotografías clínicas</div>
        )}
      </section>

      {recordStatus !== 'completed' && (
        <div className="rounded-xl border border-status-pending/30 bg-status-pending/10 px-4 py-3 text-sm text-secondary">
          Puedes guardar un borrador pero necesitas completar la ficha técnica antes de terminar el seguimiento
        </div>
      )}
      {form.validationError && (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">{form.validationError}</div>
      )}

      <footer className="flex flex-col-reverse gap-3 rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:flex-row sm:justify-end">
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-surface-hover bg-background px-4 text-sm font-semibold text-primary disabled:opacity-50" disabled={busy} onClick={form.saveDraft} type="button">
          <FiSave aria-hidden="true" /> {initialStatus === 'completed' ? 'Guardar cambios' : 'Guardar borrador'}
        </button>
        {initialStatus !== 'completed' && (
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:opacity-50" disabled={busy} onClick={form.completeSession} type="button">
            <FiCheck aria-hidden="true" /> Completar seguimiento
          </button>
        )}
      </footer>
    </form>
  );
}
