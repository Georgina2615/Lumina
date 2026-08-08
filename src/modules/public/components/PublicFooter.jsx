import { FaInstagram, FaTiktok } from 'react-icons/fa';
import { FiMail, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Reveal } from '../../../shared/components';

// Define las redes y medios confirmados
const socialLinks = [
  { href: 'https://wa.me/529811017687', icon: FiMessageCircle, label: 'WhatsApp' },
  { href: 'https://www.instagram.com/joely.balam?igsh=MWFkNnV0eHFmeTFz', icon: FaInstagram, label: 'Instagram' },
  { href: 'https://www.tiktok.com/@georgina_321?_r=1&_t=ZS-98eNsJIoE2m', icon: FaTiktok, label: 'TikTok' }
];

// Presenta el cierre publico con enlaces confirmados
export default function PublicFooter() {
  // Devuelve informacion real del proyecto
  return (
    <footer className="relative overflow-hidden bg-primary px-5 py-12 text-surface sm:px-8 lg:px-12 lg:py-16">
      <div aria-hidden="true" className="absolute -right-28 -top-36 h-80 w-80 rounded-full border border-brand-gold/20" />
      <div aria-hidden="true" className="absolute -right-10 -top-20 h-52 w-52 rounded-full border border-brand-gold/10" />
      <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.7fr_1fr]">
        <Reveal>
          <a aria-label="Reiniciar la experiencia de Lumina Skin" className="inline-block rounded-2xl bg-background px-4 py-3" href="/">
            <img alt="Lumina Skin" className="w-48" src="/LuminaLogo.svg" />
          </a>
          <p className="mt-5 max-w-md text-sm leading-6 text-surface/70">Cuidado estético facial con atención cercana y tratamientos personalizados.</p>
          <p className="mt-5 text-xs text-brand-gold">Proyecto académico desarrollado por Joely Balam Reyes.</p>
        </Reveal>

        <Reveal delay={100}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold">Explora</p>
          <nav aria-label="Navegación del pie" className="mt-5 flex flex-col items-start gap-3">
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/servicios">Servicios</Link>
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/productos">Productos</Link>
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/contacto">Contacto</Link>
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/sobre-el-proyecto">Sobre el proyecto</Link>
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/aviso-privacidad">Aviso de privacidad</Link>
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/terminos-condiciones">Términos y condiciones</Link>
            <Link className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" to="/politica-cancelacion">Política de cancelación</Link>
            <button className="text-sm text-surface/75 transition hover:translate-x-1 hover:text-surface motion-reduce:transform-none" onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })} type="button">Volver al inicio</button>
          </nav>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold">Conecta con Lumina</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a aria-label={`Abrir ${label}`} className="group inline-flex h-11 items-center gap-2 rounded-full border border-surface/15 bg-surface/5 px-3.5 text-xs text-surface/75 transition duration-300 hover:-translate-y-0.5 hover:border-brand-gold/50 hover:bg-surface/10 hover:text-surface active:scale-[0.97] motion-reduce:transform-none" href={href} key={label} rel="noreferrer" target="_blank">
                <Icon aria-hidden="true" className="text-brand-gold" />
                {label}
              </a>
            ))}
          </div>
          <div className="mt-5 space-y-3 text-xs text-surface/65">
            <a className="flex items-center gap-2 transition hover:text-surface" href="mailto:luminask01@gmail.com"><FiMail aria-hidden="true" className="text-brand-gold" />luminask01@gmail.com</a>
            <a className="flex items-start gap-2 transition hover:text-surface" href="https://www.google.com/maps/search/?api=1&query=Avenida%20Adolfo%20Lopez%20Mateos%20426%20Campeche%20Campeche" rel="noreferrer" target="_blank"><FiMapPin aria-hidden="true" className="mt-0.5 shrink-0 text-brand-gold" />Avenida Adolfo López Mateos 426 Campeche</a>
          </div>
        </Reveal>
      </div>

      <div className="relative mx-auto mt-12 flex max-w-7xl flex-col gap-2 border-t border-surface/10 pt-6 text-[11px] text-surface/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Lumina Skin</p>
        <p>Prototipo académico de gestión estética</p>
      </div>
    </footer>
  );
}
