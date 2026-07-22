import { useState } from 'react'; 
import { Outlet, NavLink, Link } from 'react-router-dom';
import { FaInstagram, FaTiktok, FaWhatsapp, FaMapMarkerAlt } from 'react-icons/fa';
import LoginModal from '../auth/LoginModal'; 

export default function PublicLayout() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-primary font-body relative">
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {/* NAVBAR PÚBLICO */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md shadow-sm border-b border-surface-hover">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo y Nombre */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-title text-3xl font-bold tracking-wider text-primary group-hover:text-secondary transition-colors duration-300">
              LUMINA Spa
            </span>
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            {['Servicios', 'Catálogo', 'Diagnóstico Virtual', 'Conócenos'].map((item, index) => (
              <NavLink 
                key={index}
                to={`/${item.toLowerCase().replace(' ', '-')}`} 
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
            
            {/* 4. Tu botón que abre el Modal */}
            <button 
              onClick={() => setIsLoginModalOpen(true)}
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

      {/* CONTENIDO PÚBLICO */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* FOOTER DE 2 NIVELES */}
      <footer>
        <div className="bg-primary text-surface py-16">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
            
            <div>
              <h2 className="font-title text-3xl font-bold mb-4">LUMINA SPA</h2>
              <p className="text-surface/80 text-sm">
                Tecnología y naturaleza para el cuidado de tu piel. 
                Descubre tu mejor versión con nuestros tratamientos especializados.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="font-bold uppercase tracking-wider mb-2">Enlaces Legales</h3>
              <a href="#" className="text-surface/80 hover:text-white transition-colors text-sm">Aviso de Privacidad</a>
              <a href="#" className="text-surface/80 hover:text-white transition-colors text-sm">Términos y Condiciones</a>
              <a href="#" className="text-surface/80 hover:text-white transition-colors text-sm">Política de Cancelación</a>
            </div>

            <div className="flex flex-col gap-2 md:items-start items-center">
              <h3 className="font-bold uppercase tracking-wider mb-2">Encuéntranos</h3>
              <p className="flex items-center gap-2 text-surface/80 text-sm">
                <FaMapMarkerAlt /> Plaza Central, Local 12, Ciudad.
              </p>
            </div>

          </div>
        </div>

        <div className="bg-[#2A2121] py-6 border-t border-surface/10">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-surface/60 text-xs tracking-widest uppercase">
              © {new Date().getFullYear()} Lumina Clinical System. Todos los derechos reservados.
            </p>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-surface/60 hover:text-white hover:scale-110 transition-all text-xl"><FaInstagram /></a>
              <a href="#" className="text-surface/60 hover:text-white hover:scale-110 transition-all text-xl"><FaTiktok /></a>
              <a href="#" className="text-surface/60 hover:text-white hover:scale-110 transition-all text-xl"><FaWhatsapp /></a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}