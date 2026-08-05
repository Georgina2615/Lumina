import { FiArrowLeft, FiArrowRight, FiSave } from 'react-icons/fi';
import { useClinicalRecordForm } from '../hooks/UseClinicalRecordForm';
import ClinicalHistoryStep from './ClinicalHistoryStep';
import ClinicalPersonalStep from './ClinicalPersonalStep';
import ClinicalPrecautionsStep from './ClinicalPrecautionsStep';
import ClinicalRecordStepper from './ClinicalRecordStepper';
import ClinicalSkinStep from './ClinicalSkinStep';

const lastStep = 3;

// Presenta y coordina las secciones de la ficha
export default function ClinicalRecordForm({ busy, initialRecord, initialStatus, onSave }) {
  const form = useClinicalRecordForm({ initialRecord, initialStatus, onSave });
  const changeSectionField = (section) => (field, value) => (
    form.changeField(section, field, value)
  );
  const toggleSectionOption = (section) => (field, value) => (
    form.toggleOption(section, field, value)
  );

  return (
    <div className="space-y-4">
      <ClinicalRecordStepper currentStep={form.step} onChange={form.setStep} />

      <form className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6" onSubmit={(event) => event.preventDefault()}>
        {form.step === 0 && <ClinicalPersonalStep onChange={changeSectionField('personalDetails')} values={form.record.personalDetails} />}
        {form.step === 1 && <ClinicalHistoryStep onChange={changeSectionField('history')} values={form.record.history} />}
        {form.step === 2 && (
          <ClinicalPrecautionsStep
            onChange={changeSectionField('precautions')}
            onToggle={(value) => form.toggleOption('precautions', 'conditions', value)}
            values={form.record.precautions}
          />
        )}
        {form.step === 3 && (
          <ClinicalSkinStep
            onChange={changeSectionField('skinAnalysis')}
            onToggle={toggleSectionOption('skinAnalysis')}
            values={form.record.skinAnalysis}
          />
        )}

        {form.validationError && (
          <div className="mt-6 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error" role="alert">
            {form.validationError}
          </div>
        )}

        <footer className="mt-7 flex flex-col-reverse gap-3 border-t border-surface-hover pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover px-4 text-sm font-semibold text-primary disabled:opacity-40" disabled={busy || form.step === 0} onClick={() => form.setStep(form.step - 1)} type="button">
              <FiArrowLeft aria-hidden="true" /> Anterior
            </button>
            <button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-surface-hover px-4 text-sm font-semibold text-primary disabled:opacity-40" disabled={busy || form.step === lastStep} onClick={() => form.setStep(form.step + 1)} type="button">
              Siguiente <FiArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-surface-hover bg-background px-4 text-sm font-semibold text-primary disabled:opacity-50" disabled={busy} onClick={form.saveDraft} type="button">
              <FiSave aria-hidden="true" /> {initialStatus === 'completed' ? 'Guardar cambios' : 'Guardar borrador'}
            </button>
            {initialStatus !== 'completed' && (
              <button className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-surface shadow-sm transition hover:bg-secondary disabled:opacity-50" disabled={busy} onClick={form.completeRecord} type="button">
                Completar ficha
              </button>
            )}
          </div>
        </footer>
      </form>
    </div>
  );
}
