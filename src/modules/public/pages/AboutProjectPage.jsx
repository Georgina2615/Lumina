import {
  FiCalendar,
  FiDatabase,
  FiLayers,
  FiLock,
  FiMail,
  FiMonitor,
  FiPackage,
  FiUser
} from 'react-icons/fi';

// Describe las areas reales de Lumina Skin
const projectAreas = [
  { icon: FiMonitor, name: 'Sitio público', text: 'Presenta los servicios y acerca Lumina Skin a nuevas clientas.' },
  { icon: FiCalendar, name: 'Recepción', text: 'Organiza citas, clientas, cobros y ventas desde un mismo lugar.' },
  { icon: FiPackage, name: 'Administración', text: 'Permite controlar servicios, inventarios, pagos y resultados diarios.' },
  { icon: FiUser, name: 'Cosmetología', text: 'Reúne la atención en cabina, el seguimiento y los insumos utilizados.' }
];

// Enumera las herramientas que utiliza el proyecto
const projectTools = [
  { icon: FiLayers, name: 'React y Tailwind CSS', text: 'Construyen las pantallas y permiten adaptarlas a computadoras, tabletas y celulares.' },
  { icon: FiDatabase, name: 'Firebase', text: 'Guarda la información y mantiene sincronizadas las citas, los inventarios y los pagos.' },
  { icon: FiLock, name: 'Protección de acceso', text: 'Comprueba la identidad y limita cada pantalla según las actividades del personal.' },
  { icon: FiMail, name: 'EmailJS', text: 'Envía comprobantes digitales al correo de las clientas.' }
];

// Presenta la autoria y construccion del proyecto
export default function AboutProjectPage() {
  // Devuelve la historia completa de Lumina Skin
  return (
    <div className="bg-background text-primary">
      <section className="relative overflow-hidden bg-primary px-5 py-16 text-surface sm:px-8 lg:px-12 lg:py-24">
        <div aria-hidden="true" className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-status-pending/20" />
        <div aria-hidden="true" className="absolute -bottom-48 right-20 h-80 w-80 rounded-full bg-status-confirmed/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-status-pending">Proyecto académico</p>
          <div className="mt-5 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl leading-tight sm:text-6xl">Tecnología pensada para una atención más humana</h1>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-surface/70 sm:text-base">Lumina Skin reúne el trabajo diario de un centro de cuidado facial, para que cada cita tenga continuidad desde la reservación hasta el seguimiento en cabina.</p>
            </div>
            <div className="rounded-3xl border border-surface/15 bg-surface/5 p-6 backdrop-blur">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-status-pending">Creado por</p>
              <p className="mt-3 font-title text-2xl font-semibold">Joely Balam Reyes</p>
              <p className="mt-2 text-sm leading-6 text-surface/65">Diseño, investigación, programación y documentación del proyecto.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">Un solo sistema</p>
        <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">Cuatro espacios que trabajan en conjunto</h2>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projectAreas.map(({ icon: Icon, name, text }) => (
            <article className="rounded-3xl border border-surface-hover bg-surface p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transform-none" key={name}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-status-confirmed/15 text-status-confirmed"><Icon aria-hidden="true" size={20} /></span>
              <h3 className="mt-6 text-xl">{name}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-surface-hover bg-surface px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary">Cómo fue construido</p>
          <h2 className="mt-3 max-w-2xl text-3xl sm:text-4xl">Herramientas con una función clara</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">Cada herramienta fue elegida para resolver una necesidad del proyecto, sin complicar la experiencia de las personas que lo utilizan.</p>
          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {projectTools.map(({ icon: Icon, name, text }) => (
              <article className="flex gap-4 rounded-3xl bg-background p-6" key={name}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-status-pending/20 text-secondary"><Icon aria-hidden="true" size={20} /></span>
                <div><h3 className="text-lg">{name}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
