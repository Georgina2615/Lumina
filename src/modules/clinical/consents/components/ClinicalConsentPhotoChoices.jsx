const Choice = ({ checked, label, name, onChange, value }) => (
  <label className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${checked ? 'border-primary bg-primary text-surface' : 'border-surface-hover bg-background text-primary hover:border-secondary/30'}`}>
    <input checked={checked} className="sr-only" name={name} onChange={() => onChange(value)} type="radio" />
    {label}
  </label>
);

// Presenta decisiones independientes sobre fotografías
export default function ClinicalConsentPhotoChoices({ choices, onChange }) {
  return (
    <section className="space-y-5 rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl text-primary">Uso de fotografías</h2>
        <p className="mt-1 text-sm text-muted">Negarse no impide recibir el tratamiento</p>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold text-primary">Fotografías privadas para comparar la evolución</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Choice checked={choices.clinical} label="Sí autorizo" name="clinical-photos" onChange={(value) => onChange('clinical', value)} value />
          <Choice checked={!choices.clinical} label="No autorizo" name="clinical-photos" onChange={(value) => onChange('clinical', value)} value={false} />
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold text-primary">Fotografías para publicidad o redes sociales</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Choice checked={choices.marketing} label="Sí autorizo" name="marketing-photos" onChange={(value) => onChange('marketing', value)} value />
          <Choice checked={!choices.marketing} label="No autorizo" name="marketing-photos" onChange={(value) => onChange('marketing', value)} value={false} />
        </div>
      </fieldset>
    </section>
  );
}
