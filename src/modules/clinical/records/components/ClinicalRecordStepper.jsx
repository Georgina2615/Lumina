const steps = [
  'Datos personales',
  'Antecedentes',
  'Precauciones',
  'Análisis de piel'
];

// Presenta el avance de la ficha técnica
export default function ClinicalRecordStepper({ currentStep, onChange }) {
  return (
    <nav aria-label="Secciones de la ficha" className="overflow-x-auto">
      <ol className="flex min-w-max gap-2 rounded-2xl border border-surface-hover bg-surface p-1.5 shadow-sm">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              aria-current={currentStep === index ? 'step' : undefined}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition sm:px-4 ${
                currentStep === index
                  ? 'bg-primary text-surface shadow-sm'
                  : 'text-muted hover:bg-background hover:text-primary'
              }`}
              onClick={() => onChange(index)}
              type="button"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                {index + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
