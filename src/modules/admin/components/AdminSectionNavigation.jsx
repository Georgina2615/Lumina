import { FiGrid, FiPackage } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const adminSections = [
  {
    end: true,
    icon: FiGrid,
    label: 'Resumen',
    path: '/dashboard/admin'
  },
  {
    icon: FiPackage,
    label: 'Inventario retail',
    path: '/dashboard/admin/inventario-retail'
  }
];

// Presenta navegación exclusiva de capacidades administrativas
export default function AdminSectionNavigation() {
  // Devuelve pestañas compactas sin saturar la navegación global
  return (
    <nav
      aria-label="Secciones de administración"
      className="mx-auto mb-5 flex w-full max-w-7xl gap-1 overflow-x-auto rounded-2xl border border-surface-hover bg-surface p-1.5 shadow-sm"
    >
      {adminSections.map((section) => {
        const Icon = section.icon;

        return (
          <NavLink
            className={({ isActive }) => `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] ${isActive ? 'bg-primary text-surface shadow-sm' : 'text-muted hover:bg-background hover:text-primary'}`}
            end={section.end}
            key={section.path}
            to={section.path}
          >
            <Icon aria-hidden="true" />
            {section.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
