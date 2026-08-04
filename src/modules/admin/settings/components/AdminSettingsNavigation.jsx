import { FiCalendar, FiSliders } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

const settingsItems = [
  {
    icon: FiSliders,
    label: 'Servicios',
    path: '/dashboard/admin/configuracion/servicios'
  },
  {
    icon: FiCalendar,
    label: 'Disponibilidad',
    path: '/dashboard/admin/configuracion/disponibilidad'
  }
];

// Presenta las opciones relacionadas de configuracion
export default function AdminSettingsNavigation() {
  // Devuelve una navegacion adaptable y accesible
  return (
    <nav
      aria-label="Configuración administrativa"
      className="flex w-full gap-1 overflow-x-auto rounded-2xl border border-surface-hover bg-surface p-1.5 shadow-sm"
    >
      {settingsItems.map((item) => {
        const ItemIcon = item.icon;

        return (
          <NavLink
            className={({ isActive }) => `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              isActive
                ? 'bg-primary text-surface shadow-sm'
                : 'text-muted hover:bg-background hover:text-primary'
            }`}
            key={item.path}
            to={item.path}
          >
            <ItemIcon aria-hidden="true" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
