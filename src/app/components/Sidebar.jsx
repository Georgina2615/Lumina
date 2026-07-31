import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FiLogOut, FiMenu, FiUser } from 'react-icons/fi';

// Presenta la navegación principal en escritorio
export default function Sidebar({
  usuario: user,
  menuPermitido: allowedMenu,
  onLogout
}) {
  // Conserva el estado visual del menú
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Cierra el menú al interactuar fuera de su espacio
    const handlePointerDown = (event) => {
      if (!sidebarRef.current?.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    // Cierra el menú mediante el teclado
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    // Elimina las escuchas del documento
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Alterna la expansión desde el único control de apertura
  const toggleSidebar = (event) => {
    event.stopPropagation();
    setIsExpanded((currentValue) => !currentValue);
  };

  // Cierra el menú cuando ya se encuentra abierto
  const closeExpandedSidebar = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  // Devuelve la navegación adaptable
  return (
    <aside
      aria-label="Navegación principal"
      className={`z-40 hidden h-screen flex-col border-r border-surface-hover bg-surface transition-[width] duration-300 ease-out md:flex ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
      id="desktop-sidebar"
      onClick={closeExpandedSidebar}
      ref={sidebarRef}
    >
      <div className="flex h-20 items-center justify-between border-b border-surface-hover px-4">
        {isExpanded && (
          <span className="overflow-hidden whitespace-nowrap font-title text-xl font-bold text-primary">
            Lumina Skin
          </span>
        )}
        <button
          aria-controls="desktop-sidebar"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
          className="rounded-lg p-3 text-secondary transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          onClick={toggleSidebar}
          title={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
          type="button"
        >
          <FiMenu aria-hidden="true" size={24} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto px-3 py-6">
        {allowedMenu.map((item) => {
          const MenuIcon = item.icon;

          // Presenta una ruta permitida para el usuario
          return (
            <NavLink
              aria-label={isExpanded ? undefined : item.label}
              className={({ isActive }) =>
                `flex items-center gap-4 rounded-xl px-3 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                  isActive
                    ? 'bg-primary text-surface shadow-md'
                    : 'text-muted hover:bg-surface-hover hover:text-primary'
                }`
              }
              key={item.id}
              title={isExpanded ? undefined : item.label}
              to={item.path}
            >
              <span className="flex-shrink-0 text-xl">
                <MenuIcon aria-hidden="true" />
              </span>
              {isExpanded && (
                <span className="whitespace-nowrap font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="flex flex-col gap-4 border-t border-surface-hover p-4">
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              alt={`Perfil de ${user.displayName || 'usuario'}`}
              className="h-10 w-10 flex-shrink-0 rounded-full border-2 border-surface-hover object-cover"
              src={user.photoURL}
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-surface-hover bg-background text-muted"
            >
              <FiUser size={20} />
            </span>
          )}
          {isExpanded && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-bold text-primary">
                {user?.displayName || 'Personal de Lumina'}
              </span>
              <span className="truncate text-xs text-muted">{user?.email}</span>
            </div>
          )}
        </div>

        <button
          className={`flex w-full items-center gap-4 rounded-lg p-2 text-error transition-colors hover:bg-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error ${
            isExpanded ? 'justify-start px-3' : 'justify-center'
          }`}
          onClick={onLogout}
          title="Cerrar sesión"
          type="button"
        >
          <FiLogOut aria-hidden="true" className="flex-shrink-0" size={22} />
          {isExpanded && <span className="whitespace-nowrap font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
