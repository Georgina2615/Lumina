import { FiCheck } from 'react-icons/fi';

// Define las etapas visibles del formulario
const steps = ['Servicio', 'Datos y horario', 'Transferencia'];

// Presenta el avance sin controlar el formulario
export default function PublicBookingProgress({ currentStep }) {
  // Devuelve las etapas accesibles
  return (
    <ol aria-label="Progreso del agendamiento" className="grid grid-cols-3 gap-2">
      {steps.map((label, index) => {
        const number = index + 1;
        const completed = currentStep > number;
        const active = currentStep === number;
        return (
          <li className="min-w-0" key={label}>
            <div className={`h-1 rounded-full transition-colors ${active || completed ? 'bg-secondary' : 'bg-surface-hover'}`} />
            <div className="mt-3 flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active || completed ? 'bg-primary text-surface' : 'bg-surface-hover text-muted'}`}>
                {completed ? <FiCheck aria-hidden="true" /> : number}
              </span>
              <span className={`truncate text-xs ${active ? 'font-semibold text-primary' : 'text-muted'}`}>{label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
