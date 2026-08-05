import { FiClipboard, FiDollarSign } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const reportItems = [
  {
    icon: FiDollarSign,
    label: 'Cobros y ventas',
    path: '/dashboard/admin/cobros'
  },
  {
    icon: FiClipboard,
    label: 'Corte diario',
    path: '/dashboard/admin/corte-diario'
  }
];

// Presenta los accesos financieros relacionados
export default function AdminReportsNavigation() {
  return (
    <nav aria-label="Cobros y cortes" className="flex gap-1 overflow-x-auto rounded-2xl border border-surface-hover bg-surface p-1.5 shadow-sm">
      {reportItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            className={({ isActive }) => `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
              isActive ? 'bg-primary text-surface shadow-sm' : 'text-muted hover:bg-background hover:text-primary'
            }`}
            key={item.path}
            to={item.path}
          >
            <Icon aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
