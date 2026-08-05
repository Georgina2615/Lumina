import {
  ClinicalInput,
  ClinicalSelect,
  ClinicalTextArea
} from './ClinicalFormControls';
import {
  clinicalRecordOptions,
  frequencyOptions
} from '../services/ClinicalRecordOptions';

// Presenta hábitos y antecedentes relevantes
export default function ClinicalHistoryStep({ onChange, values }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl text-primary">Hábitos y antecedentes</h2>
        <p className="mt-1 text-sm text-muted">Respuestas proporcionadas por la clienta</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ClinicalInput
          label="Vasos de agua al día"
          max="30"
          min="0"
          onChange={(event) => onChange('waterGlasses', Number(event.target.value))}
          type="number"
          value={values.waterGlasses}
        />
        {['alcohol', 'coffee', 'tobacco'].map((field) => (
          <ClinicalSelect
            key={field}
            label={{ alcohol: 'Alcohol', coffee: 'Café', tobacco: 'Tabaco' }[field]}
            onChange={(event) => onChange(field, event.target.value)}
            options={frequencyOptions}
            value={values[field]}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ClinicalSelect label="Alimentación" onChange={(event) => onChange('diet', event.target.value)} options={clinicalRecordOptions.diet} value={values.diet} />
        <ClinicalSelect label="Digestión" onChange={(event) => onChange('digestion', event.target.value)} options={clinicalRecordOptions.digestion} value={values.digestion} />
        <ClinicalSelect label="Salud general" onChange={(event) => onChange('generalHealth', event.target.value)} options={clinicalRecordOptions.generalHealth} value={values.generalHealth} />
        <ClinicalSelect label="Exposición al sol" onChange={(event) => onChange('sunExposure', event.target.value)} options={clinicalRecordOptions.sunExposure} value={values.sunExposure} />
        <ClinicalSelect label="Embarazo o lactancia" onChange={(event) => onChange('pregnancyStatus', event.target.value)} options={clinicalRecordOptions.pregnancyStatus} value={values.pregnancyStatus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ClinicalTextArea label="Alergias" hint="Escribe Ninguna cuando no aplique" maxLength={1000} onChange={(event) => onChange('allergies', event.target.value)} value={values.allergies} />
        <ClinicalTextArea label="Medicamentos" hint="Escribe Ninguno cuando no aplique" maxLength={1000} onChange={(event) => onChange('medications', event.target.value)} value={values.medications} />
        <ClinicalTextArea label="Tratamientos estéticos anteriores" maxLength={2000} onChange={(event) => onChange('previousTreatments', event.target.value)} value={values.previousTreatments} />
        <ClinicalTextArea label="Rutina actual de cuidado" maxLength={2000} onChange={(event) => onChange('currentRoutine', event.target.value)} value={values.currentRoutine} />
      </div>
    </div>
  );
}
