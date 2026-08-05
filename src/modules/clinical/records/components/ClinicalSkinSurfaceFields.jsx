import {
  ClinicalCheckboxGroup,
  ClinicalInput,
  ClinicalSelect,
  ClinicalTextArea
} from './ClinicalFormControls';
import { clinicalRecordOptions } from '../services/ClinicalRecordOptions';

// Presenta la observación superficial de la piel
export default function ClinicalSkinSurfaceFields({ onChange, onToggle, values }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClinicalSelect label="Coloración" onChange={(event) => onChange('coloration', event.target.value)} options={clinicalRecordOptions.coloration} value={values.coloration} />
        <ClinicalSelect label="Brillo" onChange={(event) => onChange('shine', event.target.value)} options={clinicalRecordOptions.shine} value={values.shine} />
        <ClinicalSelect label="Hidratación" onChange={(event) => onChange('hydration', event.target.value)} options={clinicalRecordOptions.hydration} value={values.hydration} />
        <ClinicalSelect label="Secreción sebácea" onChange={(event) => onChange('sebum', event.target.value)} options={clinicalRecordOptions.sebum} value={values.sebum} />
        <ClinicalSelect label="Tono muscular" onChange={(event) => onChange('muscleTone', event.target.value)} options={clinicalRecordOptions.muscleTone} value={values.muscleTone} />
        <ClinicalInput label="Fototipo del uno al seis" max="6" min="0" onChange={(event) => onChange('phototype', Number(event.target.value))} type="number" value={values.phototype} />
      </div>

      <ClinicalCheckboxGroup label="Textura" onToggle={(value) => onToggle('texture', value)} options={clinicalRecordOptions.texture} values={values.texture} />
      <ClinicalCheckboxGroup label="Poros" onToggle={(value) => onToggle('pores', value)} options={clinicalRecordOptions.pores} values={values.pores} />
      <ClinicalCheckboxGroup label="Tipo de piel" onToggle={(value) => onToggle('skinTypes', value)} options={clinicalRecordOptions.skinTypes} values={values.skinTypes} />
      <ClinicalCheckboxGroup label="Lesiones observadas" onToggle={(value) => onToggle('lesions', value)} options={clinicalRecordOptions.lesions} values={values.lesions} />
      <ClinicalCheckboxGroup label="Posibles factores de acné" onToggle={(value) => onToggle('acneFactors', value)} options={clinicalRecordOptions.acneFactors} values={values.acneFactors} />
      <ClinicalTextArea label="Observaciones sobre acné" maxLength={1000} onChange={(event) => onChange('acneNotes', event.target.value)} value={values.acneNotes} />
    </div>
  );
}
