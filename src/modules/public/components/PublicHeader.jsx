import { NavLink, Link } from 'react-router-dom';

export default function PublicHeader({ onOpenLoginModal }) {
  const navItems = ['Servicios', 'Catálogo', 'Diagnóstico Virtual', 'Conócenos'];

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md shadow-sm border-b border-surface-hover">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo y Nombre */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-title text-3xl font-bold tracking-wider text-primary group-hover:text-secondary transition-colors duration-300">
            LUMINA Spa
          </span>
        </Link>

        {/* Enlaces Principales */}
        <nav className="hidden md:flex gap-8 items-center">
          {navItems.map((item, index) => (
            <NavLink 
              key={index}
              to={`/${item.toLowerCase().replace(/ /g, '-')}`} 
              className={({ isActive }) => 
                `text-sm font-medium uppercase tracking-wide transition-all duration-300 py-2 relative group ${
                  isActive ? "text-primary" : "text-muted hover:text-primary"
                }`
              }
            >
              {item}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary transition-all duration-300 group-hover:w-full"></span>
            </NavLink>
          ))}
        </nav>

        {/* Botones de Acción */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenLoginModal}
            className="hidden md:block text-sm font-semibold text-secondary hover:text-primary transition-colors duration-300 cursor-pointer bg-transparent border-none"
          >
            Iniciar Sesión
          </button>
          
          <Link 
            to="/agendar"
            className="px-6 py-2.5 bg-primary text-surface rounded-full hover:bg-secondary hover:scale-105 transition-all duration-300 text-sm font-bold shadow-md uppercase tracking-wider"
          >
            Agendar Cita
          </Link>
        </div>

      </div>
    </header>
  );
}