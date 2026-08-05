import {
  ClinicalInput,
  ClinicalTextArea
} from './ClinicalFormControls';

// Presenta los datos personales de la ficha
export default function ClinicalPersonalStep({ onChange, values }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl text-primary">Datos personales</h2>
        <p className="mt-1 text-sm text-muted">Información declarada por la clienta</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ClinicalInput
          label="Fecha de nacimiento"
          max={new Date().toISOString().slice(0, 10)}
          onChange={(event) => onChange('birthDate', event.target.value)}
          type="date"
          value={values.birthDate}
        />
        <ClinicalInput
          label="Ocupación"
          maxLength={300}
          onChange={(event) => onChange('occupation', event.target.value)}
          placeholder="Ocupación actual"
          type="text"
          value={values.occupation}
        />
      </div>

      <ClinicalTextArea
        label="Dirección"
        maxLength={500}
        onChange={(event) => onChange('address', event.target.value)}
        placeholder="Dirección opcional"
        value={values.address}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <ClinicalInput
          label="Número de embarazos"
          max="30"
          min="0"
          onChange={(event) => onChange('pregnancies', Number(event.target.value))}
          type="number"
          value={values.pregnancies}
        />
        <ClinicalInput
          label="Número de cesáreas"
          max="20"
          min="0"
          onChange={(event) => onChange('cesareans', Number(event.target.value))}
          type="number"
          value={values.cesareans}
        />
        <label className="flex min-h-11 items-center gap-3 self-end rounded-xl border border-surface-hover bg-background px-3 py-2 text-sm font-semibold text-muted sm:mt-2">
          <input
            checked={values.hysterectomy}
            className="h-4 w-4 accent-primary"
            onChange={(event) => onChange('hysterectomy', event.target.checked)}
            type="checkbox"
          />
          Histerectomía
        </label>
      </div>

      <ClinicalTextArea
        label="Operaciones anteriores"
        maxLength={1000}
        onChange={(event) => onChange('surgeries', event.target.value)}
        placeholder="Escribe Ninguna cuando no aplique"
        value={values.surgeries}
      />
      <ClinicalTextArea
        label="Otras intervenciones"
        maxLength={1000}
        onChange={(event) => onChange('otherProcedures', event.target.value)}
        placeholder="Escribe Ninguna cuando no aplique"
        value={values.otherProcedures}
      />
    </div>
  );
}
