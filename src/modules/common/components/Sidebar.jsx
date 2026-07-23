import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FiMenu, FiLogOut } from 'react-icons/fi'; 


export default function Sidebar({ usuario, menuPermitido, onLogout }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      ref={sidebarRef}
      onClick={() => { if (!isExpanded) setIsExpanded(true); }}
      className={`hidden md:flex flex-col bg-surface border-r border-surface-hover transition-all duration-300 ease-in-out z-40 h-screen cursor-pointer ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      <div className="h-20 flex items-center justify-between px-4 border-b border-surface-hover">
        {isExpanded && (
          <span className="font-title font-bold text-xl text-primary whitespace-nowrap overflow-hidden">
            Lumina Skin
          </span>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} 
          className="p-2 md:p-3 rounded-lg hover:bg-surface-hover text-secondary transition-colors"
          title="Alternar Menú"
        >
          <FiMenu size={24} />
        </button>
      </div>

      {/* ZONA CENTRAL: Navegación de Botones */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden">
        {menuPermitido.map((item, index) => {
          const Icono = item.icon; 
          
          return (
            <NavLink 
              key={index} 
              to={item.path} 
              className={({ isActive }) => 
                `flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-surface shadow-md' 
                    : 'text-muted hover:bg-surface-hover hover:text-primary'
                }`
              }
            >
              <span className="text-xl flex-shrink-0">
                <Icono /> 
              </span>
              
              {isExpanded && (
                <span className="font-medium whitespace-nowrap">
                  {item.label} 
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-hover flex flex-col gap-4 cursor-default" onClick={(e) => e.stopPropagation()}>
        
        {/* Datos de Google */}
        <div className="flex items-center gap-3">
          <img 
            src={usuario?.photoURL || 'https://ui-avatars.com/api/?name=Lumina+Skin'} 
            alt="Perfil" 
            className="w-10 h-10 rounded-full border-2 border-surface-hover object-cover flex-shrink-0" 
          />
          {isExpanded && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-primary truncate">
                {usuario?.displayName || 'Recepcionista'}
              </span>
              <span className="text-xs text-muted truncate">
                {usuario?.email}
              </span>
            </div>
          )}
        </div>

        {/* Botón Salir */}
        <button 
          onClick={onLogout} 
          className={`flex items-center gap-4 p-2 rounded-lg text-error hover:bg-error/10 transition-colors w-full ${isExpanded ? 'justify-start px-3' : 'justify-center'}`}
          title="Cerrar Sesión"
        >
          <FiLogOut size={22} className="flex-shrink-0" />
          {isExpanded && <span className="font-medium whitespace-nowrap">Cerrar Sesión</span>}
        </button>

      </div>
    </aside>
  );
}