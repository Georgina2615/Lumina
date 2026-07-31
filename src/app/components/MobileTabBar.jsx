import { NavLink } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

// Presenta la navegación principal en dispositivos móviles
export default function MobileTabBar({ allowedMenu, onLogout }) {
  // Devuelve los accesos permitidos para el rol
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-surface-hover flex justify-around items-center p-2 shadow-lg shadow-surface-hover/40 z-50 rounded-t-2xl">
      {allowedMenu.map((item) => (
        <NavLink 
          key={item.id} 
          to={item.path}
          className={({ isActive }) => 
            `flex flex-col items-center p-2 min-w-[64px] transition-colors duration-300 ${
              isActive 
                ? "text-primary" 
                : "text-muted hover:text-primary"
            }`
          }
        >
          <item.icon className="text-2xl mb-1" />
          <span className="text-[10px] font-semibold tracking-wide">
            {item.label}
          </span>
        </NavLink>
      ))}
      
      <button 
        onClick={onLogout}
        className="flex flex-col items-center p-2 min-w-[64px] text-error hover:text-error/80 transition-colors duration-300"
      >
        <FaSignOutAlt className="text-2xl mb-1" />
        <span className="text-[10px] font-semibold tracking-wide">Salir</span>
      </button>
    </nav>
  );
}
