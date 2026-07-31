// Presenta una columna operativa del tablero
export default function KanbanColumn({
  title,
  titleColor,
  count,
  emptyMessage,
  children
}) {
  return (
    <section className="flex min-w-[340px] flex-1 flex-col rounded-2xl border border-surface-hover bg-surface p-4">
      <h2 className={`mb-4 flex items-center justify-between font-title text-lg font-semibold ${titleColor}`}>
        {title}
        <span className="bg-background text-primary text-xs py-1 px-3 rounded-full shadow-sm">
          {count}
        </span>
      </h2>
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
        {count === 0 ? (
          <p className="text-sm text-muted text-center italic mt-10">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
