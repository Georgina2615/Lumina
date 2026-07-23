export default function KanbanColumn({ titulo, colorTitulo, cantidad, mensajeVacio, children }) {
  return (
    <div className="flex-1 min-w-[340px] bg-surface rounded-2xl p-4 flex flex-col border border-surface-hover">
      <h2 className={`font-title font-semibold text-lg ${colorTitulo} mb-4 flex items-center justify-between`}>
        {titulo}
        <span className="bg-background text-primary text-xs py-1 px-3 rounded-full shadow-sm">
          {cantidad}
        </span>
      </h2>
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-1">
        {cantidad === 0 ? (
          <p className="text-sm text-muted text-center italic mt-10">
            {mensajeVacio}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}