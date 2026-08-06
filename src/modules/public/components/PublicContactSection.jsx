import { FiMail, FiMapPin, FiMessageCircle } from 'react-icons/fi';

// Define los medios de contacto confirmados
const contactOptions = [
  {
    href: 'https://wa.me/529811017687',
    icon: FiMessageCircle,
    label: 'WhatsApp',
    value: '981 101 7687'
  },
  {
    href: 'mailto:luminask01@gmail.com',
    icon: FiMail,
    label: 'Correo',
    value: 'luminask01@gmail.com'
  },
  {
    href: 'https://www.google.com/maps/search/?api=1&query=Avenida%20Adolfo%20Lopez%20Mateos%20426%20Campeche%20Campeche',
    icon: FiMapPin,
    label: 'Ubicación',
    value: 'Avenida Adolfo López Mateos 426 Campeche'
  }
];

// Presenta los canales reales de Lumina Skin
export default function PublicContactSection() {
  // Devuelve una seccion sin datos simulados
  return (
    <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28" id="contacto">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-10 text-surface shadow-2xl shadow-primary/10 sm:px-10 lg:px-14 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-status-pending">Estamos para orientarte</p>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">Da el primer paso hacia el cuidado de tu piel</h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-surface/70">Escríbenos para resolver tus dudas y conocer el tratamiento más adecuado para tu próxima visita.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {contactOptions.map(({ href, icon: Icon, label, value }) => (
              <a className="group rounded-2xl border border-surface/15 bg-surface/5 p-4 transition duration-300 hover:-translate-y-1 hover:bg-surface/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-pending motion-reduce:transform-none" href={href} key={label} rel="noreferrer" target={href.startsWith('mailto:') ? undefined : '_blank'}>
                <Icon aria-hidden="true" className="text-status-pending" size={20} />
                <span className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-surface/55">{label}</span>
                <span className="mt-1 block break-words text-xs leading-5 text-surface">{value}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
