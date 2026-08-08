import { useState } from 'react';
import { FiCalendar, FiLogIn, FiMenu, FiX } from 'react-icons/fi';
import { Link, NavLink } from 'react-router-dom';

// Define los destinos informativos de escritorio
const desktopNavigation = [
  { end: true, label: 'Inicio', to: '/' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Productos', to: '/productos' },
  { label: 'Test de piel', to: '/test-de-piel' },
  { label: 'Contacto', to: '/contacto' },
  { label: 'Mi cuenta', to: '/mi-cuenta' }
];

// Agrupa los destinos para lectura movil
const mobileNavigationGroups = [
  {
    items: desktopNavigation.slice(0, 4),
    label: 'Explorar'
  },
  {
    items: [
      { label: 'Agendar cita', to: '/agendar' },
      desktopNavigation[5]
    ],
    label: 'Tu visita'
  },
  {
    items: [desktopNavigation[4]],
    label: 'Ayuda'
  }
];

// Resalta el destino vigente en escritorio
const getDesktopLinkClassName = ({ isActive }) => `relative py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:origin-left after:rounded-full after:bg-brand-gold after:transition-transform after:duration-300 ${isActive ? 'text-primary after:scale-x-100' : 'text-muted after:scale-x-0 hover:text-primary hover:after:scale-x-100'}`;

// Resalta el destino vigente en movil
const getMobileLinkClassName = ({ isActive }) => `rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[0.99] ${isActive ? 'bg-primary text-surface' : 'text-primary hover:bg-surface'}`;

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
      <div aria-hidden="true" className="h-1 bg-gradient-to-r from-brand-sage via-brand-gold to-brand-blush" />
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
        <a aria-label="Reiniciar la experiencia de Lumina Skin" className="group shrink-0" href="/">
          <img alt="Lumina Skin" className="h-auto w-36 transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] motion-reduce:transform-none sm:w-44" src="/LuminaLogo.svg" />
        </a>

        <nav aria-label="Navegación principal" className="hidden items-center gap-5 xl:flex">
          {desktopNavigation.map(({ end, label, to }) => (
            <NavLink className={getDesktopLinkClassName} end={end} key={to} to={to}>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button aria-label="Abrir acceso para el personal" className="hidden min-h-10 items-center gap-2 rounded-full border border-transparent px-4 text-sm font-semibold text-secondary transition duration-300 hover:border-surface-hover hover:bg-surface hover:text-primary xl:inline-flex" onClick={onOpenLoginModal} type="button">
            <FiLogIn aria-hidden="true" />
            Personal
          </button>
          <Link aria-label="Agendar una cita" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-gold px-4 text-sm font-semibold text-primary shadow-md shadow-brand-gold/20 transition duration-300 hover:-translate-y-0.5 hover:brightness-95 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 motion-reduce:transform-none sm:px-5" to="/agendar">
            <FiCalendar aria-hidden="true" />
            <span className="hidden sm:inline">Agendar cita</span>
          </Link>
          <button aria-controls="public-mobile-navigation" aria-expanded={mobileNavigationOpen} aria-label={mobileNavigationOpen ? 'Cerrar menú' : 'Abrir menú'} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-surface-hover bg-surface text-primary transition hover:border-secondary/40 xl:hidden" onClick={() => setMobileNavigationOpen((currentValue) => !currentValue)} type="button">
            {mobileNavigationOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </div>

      <button
        aria-label="Cerrar menú"
        className={`fixed inset-0 top-[5.25rem] bg-primary/20 backdrop-blur-[2px] transition-opacity duration-300 xl:hidden ${mobileNavigationOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
        onClick={closeMobileNavigation}
        tabIndex="-1"
        type="button"
      />
      <nav
        aria-hidden={!mobileNavigationOpen}
        aria-label="Navegación móvil"
        className={`absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] origin-top overflow-y-auto border-b border-surface-hover bg-background px-5 py-5 shadow-xl shadow-primary/10 transition duration-300 ease-out xl:hidden ${mobileNavigationOpen ? 'visible translate-y-0 scale-y-100 opacity-100' : 'invisible -translate-y-3 scale-y-95 opacity-0'}`}
        id="public-mobile-navigation"
        inert={!mobileNavigationOpen ? '' : undefined}
      >
          <div className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-3">
            {mobileNavigationGroups.map(({ items, label }) => (
              <div key={label}>
                <p className="px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-secondary">{label}</p>
                <div className="mt-2 flex flex-col gap-1">
                  {items.map(({ end, label: itemLabel, to }) => <NavLink className={getMobileLinkClassName} end={end} key={to} onClick={closeMobileNavigation} to={to}>{itemLabel}</NavLink>)}
                </div>
              </div>
            ))}
            <button className="flex items-center gap-2 rounded-xl border-t border-surface-hover px-4 py-3 text-left text-sm font-semibold text-secondary transition hover:bg-surface active:scale-[0.99] sm:col-span-3" onClick={openMobileLogin} type="button">
              <FiLogIn aria-hidden="true" />
              Acceso del personal
            </button>
          </div>
      </nav>
    </header>
  );
}
