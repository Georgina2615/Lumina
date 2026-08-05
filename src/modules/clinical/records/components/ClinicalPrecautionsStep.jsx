import {
  ClinicalCheckboxGroup,
  ClinicalTextArea
} from './ClinicalFormControls';
import { clinicalRecordOptions } from '../services/ClinicalRecordOptions';

// Presenta condiciones que requieren precaución
export default function ClinicalPrecautionsStep({ onChange, onToggle, values }) {
  // Alterna la declaración de ausencia de condiciones
  const changeNoKnownConditions = (checked) => {
    onChange('hasNoKnownConditions', checked);
    if (checked) onChange('conditions', []);
  };

  // Alterna una condición y desmarca la ausencia
  const toggleCondition = (value) => {
    if (values.hasNoKnownConditions) onChange('hasNoKnownConditions', false);
    onToggle(value);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl text-primary">Condiciones y precauciones</h2>
        <p className="mt-1 text-sm text-muted">Esta información no representa un diagnóstico médico</p>
      </div>

      <label className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
        values.hasNoKnownConditions
          ? 'border-status-confirmed/40 bg-status-confirmed/10 text-primary'
          : 'border-surface-hover bg-background text-muted'
      }`}>
        <input
          checked={values.hasNoKnownConditions}
          className="h-4 w-4 accent-primary"
          onChange={(event) => changeNoKnownConditions(event.target.checked)}
          type="checkbox"
        />
        La clienta no declara condiciones conocidas
      </label>

      <ClinicalCheckboxGroup
        label="Condiciones declaradas"
        onToggle={toggleCondition}
        options={clinicalRecordOptions.precautions}
        values={values.conditions}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ClinicalTextArea label="Observaciones sobre presión arterial" maxLength={500} onChange={(event) => onChange('bloodPressureNotes', event.target.value)} value={values.bloodPressureNotes} />
        <ClinicalTextArea label="Alteraciones conocidas de la piel" maxLength={1000} onChange={(event) => onChange('skinConditionNotes', event.target.value)} value={values.skinConditionNotes} />
      </div>
      <ClinicalTextArea label="Otras condiciones" maxLength={1000} onChange={(event) => onChange('otherConditions', event.target.value)} value={values.otherConditions} />
    </div>
  );
}
