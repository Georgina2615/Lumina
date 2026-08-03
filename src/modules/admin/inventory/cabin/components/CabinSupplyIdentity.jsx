import { FiAlertTriangle, FiDroplet } from 'react-icons/fi';

// Presenta identidad y advertencias del insumo
export default function CabinSupplyIdentity({ compact = false, supply }) {
  // Devuelve una identidad reutilizable
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`${compact ? 'h-11 w-11' : 'h-14 w-14'} flex shrink-0 items-center justify-center rounded-xl border border-status-incabin/20 bg-status-incabin/10 text-status-incabin`}>
        <FiDroplet aria-hidden="true" size={20} />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-semibold text-primary">{supply.name}</p>
          {!supply.active && (
            <span className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
              Inactivo
            </span>
          )}
        </div>
        <p className="truncate text-xs text-muted">
          {supply.brand} · {supply.category}
        </p>
        <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          Control por {supply.unit}
        </p>
        {supply.warnings.length > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-error">
            <FiAlertTriangle aria-hidden="true" />
            Requiere completar información
          </p>
        )}
      </div>
    </div>
  );
}
