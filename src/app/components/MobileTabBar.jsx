import { NavLink, useLocation } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

// Presenta la navegación principal en dispositivos móviles
export default function MobileTabBar({ allowedMenu, onLogout }) {
  const { pathname } = useLocation();
  // Evita duplicar el cambio de espacio en la barra inferior
  const mobileMenu = allowedMenu.filter((item) => !item.mobileHidden);

  // Devuelve los accesos permitidos para el rol
  return (
    <nav
      aria-label="Navegación principal móvil"
      className="fixed bottom-0 left-0 z-40 flex w-full items-stretch rounded-t-2xl border-t border-surface-hover bg-surface px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-lg shadow-surface-hover/40 md:hidden"
    >
      {mobileMenu.map((item) => (
        <NavLink
          aria-label={item.label}
          aria-current={item.activePaths?.includes(pathname) ? 'page' : undefined}
          end={item.end}
          key={item.id}
          to={item.path}
          className={({ isActive }) => {
            const isSectionActive = isActive
              || item.activePaths?.includes(pathname);
            return `flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
              isSectionActive
                ? 'bg-surface-hover/70 text-primary'
                : item.intent === 'switch'
                  ? 'bg-background/70 text-secondary hover:text-primary'
                  : 'text-muted hover:text-primary'
            }`;
          }}
        >
          <item.icon aria-hidden="true" className="mb-1 text-2xl" />
          <span className="w-full truncate text-center text-[10px] font-semibold tracking-wide">
            {item.mobileLabel || item.label}
          </span>
        </NavLink>
      ))}

      <button
        aria-label="Cerrar sesión"
        onClick={onLogout}
        className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-1 py-2 text-error transition-colors duration-200 hover:bg-error/5 hover:text-error/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
        type="button"
      >
        <FaSignOutAlt aria-hidden="true" className="mb-1 text-2xl" />
        <span className="w-full truncate text-center text-[10px] font-semibold tracking-wide">
          Salir
        </span>
      </button>
    </nav>
  );
}
