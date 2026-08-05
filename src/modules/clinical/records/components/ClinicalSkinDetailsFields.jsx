import {
  ClinicalCheckboxGroup,
  ClinicalTextArea
} from './ClinicalFormControls';
import { clinicalRecordOptions } from '../services/ClinicalRecordOptions';

// Presenta alteraciones y evaluación estética
export default function ClinicalSkinDetailsFields({ onChange, onToggle, values }) {
  return (
    <div className="space-y-5">
      <ClinicalCheckboxGroup label="Pigmentación" onToggle={(value) => onToggle('pigmentation', value)} options={clinicalRecordOptions.pigmentation} values={values.pigmentation} />
      <ClinicalCheckboxGroup label="Vascularización" onToggle={(value) => onToggle('vascularization', value)} options={clinicalRecordOptions.vascularization} values={values.vascularization} />
      <ClinicalCheckboxGroup label="Arrugas" onToggle={(value) => onToggle('wrinkles', value)} options={clinicalRecordOptions.wrinkles} values={values.wrinkles} />
      <ClinicalCheckboxGroup label="Flacidez" onToggle={(value) => onToggle('flaccidity', value)} options={clinicalRecordOptions.flaccidity} values={values.flaccidity} />
      <ClinicalCheckboxGroup label="Contorno de ojos" onToggle={(value) => onToggle('eyeArea', value)} options={clinicalRecordOptions.eyeArea} values={values.eyeArea} />
      <ClinicalCheckboxGroup label="Cicatrices" onToggle={(value) => onToggle('scars', value)} options={clinicalRecordOptions.scars} values={values.scars} />
      <ClinicalTextArea label="Observaciones superficiales" maxLength={2000} onChange={(event) => onChange('surfaceObservations', event.target.value)} value={values.surfaceObservations} />
      <ClinicalTextArea label="Evaluación estética" hint="Describe lo observado sin emitir un diagnóstico médico" maxLength={2000} onChange={(event) => onChange('aestheticAssessment', event.target.value)} value={values.aestheticAssessment} />
      <ClinicalTextArea label="Tratamiento recomendado y motivos" maxLength={2000} onChange={(event) => onChange('treatmentRationale', event.target.value)} value={values.treatmentRationale} />
    </div>
  );
}
