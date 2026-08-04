import { FiCalendar, FiLock } from 'react-icons/fi';
import { formatAvailabilityDate } from '../services/AdminAvailabilityPolicy';

// Presenta los bloqueos administrativos futuros
export default function UpcomingAvailabilityBlocks({
  blocks,
  onOpenDate,
  onReopen
}) {
  // Explica cuando no existen bloqueos
  if (blocks.length === 0) {
    return (
      <div className="flex min-h-44 flex-col items-center justify-center rounded-2xl border border-dashed border-surface-hover bg-surface px-5 text-center">
        <FiCalendar aria-hidden="true" className="text-muted" size={24} />
        <h2 className="mt-3 text-lg text-primary">Sin próximos bloqueos</h2>
      </div>
    );
  }

  // Devuelve una lista breve de bloqueos
  return (
    <div className="overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm">
      {blocks.map((block) => (
        <article className="flex flex-wrap items-center gap-3 border-b border-surface-hover px-4 py-3 last:border-b-0" key={block.id}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-pending/20 text-primary">
            <FiLock aria-hidden="true" />
          </span>
          <div className="min-w-48 flex-1">
            <p className="font-semibold text-primary">
              {formatAvailabilityDate(block.dateKey)} · {block.time}
            </p>
            {block.reason && (
              <p className="mt-0.5 text-sm text-muted">{block.reason}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="min-h-10 rounded-xl border border-surface-hover px-3 text-sm font-semibold text-primary hover:bg-background" onClick={() => onOpenDate(block.dateKey)} type="button">
              Ver fecha
            </button>
            <button className="min-h-10 rounded-xl bg-primary px-3 text-sm font-semibold text-surface hover:bg-secondary" onClick={() => onReopen(block)} type="button">
              Reabrir
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
