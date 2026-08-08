import { FiCheck } from 'react-icons/fi';

// Define las etapas visibles del formulario
const steps = ['Servicio', 'Datos y horario', 'Pago seguro'];

// Presenta el avance sin controlar el formulario
export default function PublicBookingProgress({ currentStep }) {
  // Identifica la etapa visible en movil
  const currentLabel = steps[currentStep - 1];

  // Devuelve las etapas accesibles
  return (
    <div aria-label="Progreso del agendamiento">
      <div className="mb-3 flex items-center justify-between gap-4 sm:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-secondary">Paso {currentStep} de {steps.length}</p>
        <p className="text-xs font-semibold text-primary">{currentLabel}</p>
      </div>
      <div aria-hidden="true" className="grid grid-cols-3 gap-2 sm:hidden">
        {steps.map((label, index) => <span className={`h-1.5 rounded-full transition-colors duration-300 ${index < currentStep ? 'bg-secondary' : 'bg-surface-hover'}`} key={label} />)}
      </div>
      <ol className="hidden grid-cols-3 gap-3 sm:grid">
        {steps.map((label, index) => {
          const number = index + 1;
          const completed = currentStep > number;
          const active = currentStep === number;
          return (
            <li className="min-w-0" key={label}>
              <div className={`h-1 rounded-full transition-colors ${active || completed ? 'bg-secondary' : 'bg-surface-hover'}`} />
              <div className="mt-3 flex items-center gap-2">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active || completed ? 'bg-primary text-surface' : 'bg-surface-hover text-muted'}`}>{completed ? <FiCheck aria-hidden="true" /> : number}</span>
                <span className={`truncate text-xs ${active ? 'font-semibold text-primary' : 'text-muted'}`}>{label}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
