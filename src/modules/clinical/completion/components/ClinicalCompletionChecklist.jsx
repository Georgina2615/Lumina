import { FiCheck, FiCircle } from 'react-icons/fi';

// Presenta los requisitos del cierre clínico
export default function ClinicalCompletionChecklist({ requirements }) {
  return (
    <section className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm">
      <h2 className="text-xl text-primary">Antes de enviar a recepción</h2>
      <div className="mt-4 divide-y divide-surface-hover">
        {requirements.map((requirement) => (
          <div className="flex items-center gap-3 py-4" key={requirement.id}>
            {requirement.complete ? <FiCheck aria-hidden="true" className="text-xl text-status-confirmed" /> : <FiCircle aria-hidden="true" className="text-xl text-muted" />}
            <span className={requirement.complete ? 'font-medium text-primary' : 'text-muted'}>{requirement.label}</span>
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${requirement.complete ? 'bg-status-confirmed/10 text-status-confirmed' : 'bg-background text-muted'}`}>{requirement.complete ? 'Listo' : 'Pendiente'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
