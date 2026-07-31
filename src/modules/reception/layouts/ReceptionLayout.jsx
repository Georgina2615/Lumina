import { FiArrowLeft } from 'react-icons/fi';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/context';

// Delimita las capacidades operativas de recepción
export default function ReceptionLayout() {
  const { rol: role } = useAuth();

  // Presenta el contexto especial únicamente al administrador
  return (
    <div className="min-h-full w-full">
      {role === 'admin' && (
        <aside className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-status-incabin/25 bg-status-incabin/10 px-3 py-2.5 shadow-sm md:hidden">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Modo recepción
            </p>
            <p className="truncate text-xs font-semibold text-primary">
              Operando como administradora
            </p>
          </div>
          <Link
            aria-label="Volver a administración"
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-surface-hover bg-background px-3 text-xs font-semibold text-primary transition hover:border-secondary/40 hover:shadow-sm active:scale-[0.98]"
            to="/dashboard/admin"
          >
            <FiArrowLeft aria-hidden="true" />
            Admin
          </Link>
        </aside>
      )}
      <Outlet />
    </div>
  );
}
