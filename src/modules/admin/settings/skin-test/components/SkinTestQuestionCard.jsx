import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi';
import { skinResultOptions } from '../services/AdminSkinTestDefaults';

const influenceOptions = [
  { label: 'Sin influencia', value: 0 },
  { label: 'Ligera', value: 1 },
  { label: 'Media', value: 2 },
  { label: 'Principal', value: 3 }
];

// Presenta una pregunta y sus respuestas editables
export default function SkinTestQuestionCard({
  canMoveDown,
  canMoveUp,
  canRemove,
  index,
  onAddOption,
  onMove,
  onRemove,
  onRemoveOption,
  onUpdate,
  onUpdateOption,
  question
}) {
  return (
    <article className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background text-sm font-semibold text-secondary">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <label className="text-xs font-semibold text-muted" htmlFor={`question-${question.id}`}>Pregunta</label>
          <input className="mt-1 min-h-11 w-full rounded-xl border border-surface-hover bg-background px-3 text-sm outline-none focus:border-secondary" id={`question-${question.id}`} maxLength={180} onChange={(event) => onUpdate({ text: event.target.value })} value={question.text} />
        </div>
        <div className="flex shrink-0 gap-1">
          <button aria-label="Subir pregunta" className="rounded-lg p-2 text-muted hover:bg-background disabled:opacity-30" disabled={!canMoveUp} onClick={() => onMove(-1)} type="button"><FiArrowUp /></button>
          <button aria-label="Bajar pregunta" className="rounded-lg p-2 text-muted hover:bg-background disabled:opacity-30" disabled={!canMoveDown} onClick={() => onMove(1)} type="button"><FiArrowDown /></button>
          <button aria-label="Eliminar pregunta" className="rounded-lg p-2 text-error hover:bg-error/10 disabled:opacity-30" disabled={!canRemove} onClick={onRemove} type="button"><FiTrash2 /></button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {question.options.map((option) => (
          <div className="grid gap-2 rounded-xl bg-background p-3 md:grid-cols-[minmax(12rem,1fr)_minmax(11rem,0.7fr)_9rem_auto]" key={option.id}>
            <input aria-label="Texto de respuesta" className="min-h-10 rounded-lg border border-surface-hover bg-surface px-3 text-sm outline-none focus:border-secondary" maxLength={120} onChange={(event) => onUpdateOption(option.id, { label: event.target.value })} value={option.label} />
            <select aria-label="Recomendación relacionada" className="min-h-10 rounded-lg border border-surface-hover bg-surface px-2 text-sm" onChange={(event) => onUpdateOption(option.id, { resultKey: event.target.value })} value={option.resultKey}>
              {skinResultOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
            </select>
            <select aria-label="Influencia de la respuesta" className="min-h-10 rounded-lg border border-surface-hover bg-surface px-2 text-sm" onChange={(event) => onUpdateOption(option.id, { points: Number(event.target.value) })} value={option.points}>
              {influenceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button aria-label="Eliminar respuesta" className="min-h-10 rounded-lg px-3 text-error hover:bg-error/10 disabled:opacity-30" disabled={question.options.length <= 2} onClick={() => onRemoveOption(option.id)} type="button"><FiTrash2 /></button>
            <label className="flex items-center gap-2 text-xs text-muted md:col-span-4"><input checked={option.requiresContact} className="h-4 w-4 accent-primary" onChange={(event) => onUpdateOption(option.id, { requiresContact: event.target.checked })} type="checkbox" />Pedir que contacte a Lumina antes de agendar</label>
          </div>
        ))}
      </div>
      <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-surface-hover px-3 text-sm font-semibold hover:bg-background disabled:opacity-40" disabled={question.options.length >= 5} onClick={onAddOption} type="button"><FiPlus />Agregar respuesta</button>
    </article>
  );
}
