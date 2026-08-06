import { useState } from 'react';
import { FiCalendar, FiLogIn, FiMenu, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Define los destinos disponibles en la portada
const publicNavigation = [
  { href: '/#servicios', label: 'Servicios' },
  { href: '/#contacto', label: 'Contacto' },
  { href: '/agendar', label: 'Agendar' }
];

// Presenta la navegacion publica disponible
export default function PublicHeader({ onOpenLoginModal }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);

  // Cierra la navegacion movil
  const closeMobileNavigation = () => setMobileNavigationOpen(false);

  // Abre el acceso del personal desde movil
  const openMobileLogin = () => {
    closeMobileNavigation();
    onOpenLoginModal();
  };

  // Cierra el menu mediante teclado
  const handleHeaderKeyDown = (event) => {
    // Reconoce la tecla de salida
    if (event.key === 'Escape') {
      closeMobileNavigation();
    }
  };

  // Devuelve enlaces que tienen un destino real
  return (
    <header className="sticky top-0 z-50 border-b border-surface-hover bg-background/92 shadow-sm shadow-primary/5 backdrop-blur-xl" onKeyDown={handleHeaderKeyDown}>
      <div aria-hidden="true" className="h-1 bg-gradient-to-r from-status-confirmed via-status-pending to-secondary" />
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <Link aria-label="Ir al inicio de Lumina Skin" className="group shrink-0" to="/">
          <img alt="Lumina Skin" className="h-auto w-36 transition-transform duration-300 group-hover:scale-[1.02] sm:w-44" src="/LuminaLogo.svg" />
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
          {publicNavigation.map(({ href, label }) => (
            <a className="group relative py-2 text-sm font-medium text-muted transition-colors hover:text-primary" href={href} key={href}>
              {label}
              <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-status-pending transition-transform duration-300 group-hover:scale-x-100" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button aria-label="Abrir acceso para el personal" className="hidden min-h-10 items-center gap-2 rounded-full border border-transparent px-4 text-sm font-semibold text-secondary transition duration-300 hover:border-surface-hover hover:bg-surface hover:text-primary md:inline-flex" onClick={onOpenLoginModal} type="button">
            <FiLogIn aria-hidden="true" />
            Personal
          </button>
          <Link aria-label="Agendar una cita" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-status-pending px-4 text-sm font-semibold text-primary shadow-md shadow-status-pending/20 transition duration-300 hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none sm:px-5" to="/agendar">
            <FiCalendar aria-hidden="true" />
            <span className="hidden sm:inline">Agendar cita</span>
          </Link>
          <button aria-controls="public-mobile-navigation" aria-expanded={mobileNavigationOpen} aria-label={mobileNavigationOpen ? 'Cerrar menú' : 'Abrir menú'} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface-hover bg-surface text-primary transition hover:border-secondary/40 md:hidden" onClick={() => setMobileNavigationOpen((currentValue) => !currentValue)} type="button">
            {mobileNavigationOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileNavigationOpen && (
        <nav aria-label="Navegación móvil" className="absolute inset-x-0 top-full border-b border-surface-hover bg-background px-5 py-4 shadow-xl shadow-primary/10 md:hidden" id="public-mobile-navigation">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {publicNavigation.map(({ href, label }) => (
              <a className="rounded-xl px-4 py-3 text-sm font-semibold text-primary transition hover:bg-surface" href={href} key={href} onClick={closeMobileNavigation}>{label}</a>
            ))}
            <button className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-secondary transition hover:bg-surface" onClick={openMobileLogin} type="button">
              <FiLogIn aria-hidden="true" />
              Acceso del personal
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
