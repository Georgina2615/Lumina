import { FiCalendar, FiHeart, FiMessageCircle } from 'react-icons/fi';
import { Reveal } from '../../../shared/components';

// Define el recorrido real de una visita
const experienceSteps = [
  {
    description: 'Conoce los tratamientos y resuelve tus dudas antes de elegir.',
    icon: FiMessageCircle,
    number: '01',
    title: 'Recibe orientación'
  },
  {
    description: 'Selecciona un horario disponible y registra tu anticipo en línea.',
    icon: FiCalendar,
    number: '02',
    title: 'Reserva tu momento'
  },
  {
    description: 'Recibe una atención estética organizada y pensada para tu piel.',
    icon: FiHeart,
    number: '03',
    title: 'Vive tu cuidado'
  }
];

// Presenta el recorrido sencillo de Lumina Skin
export default function PublicExperienceSection() {
  // Devuelve una explicacion clara sin promesas simuladas
  return (
    <section className="relative overflow-hidden bg-brand-blush/20 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
      <div aria-hidden="true" className="absolute left-1/2 top-12 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-sage/10 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-secondary">Tu experiencia</p>
          <h2 className="mt-4 text-4xl leading-tight text-primary sm:text-5xl">Cuidarte puede sentirse sencillo</h2>
          <p className="mt-4 text-base leading-7 text-muted">Te acompañamos desde tu primera duda hasta el momento de tu atención.</p>
        </Reveal>

        <div className="relative mt-12 grid gap-4 lg:grid-cols-3">
          <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent lg:block" />
          {experienceSteps.map(({ description, icon: Icon, number, title }, index) => (
            <Reveal className="relative" delay={index * 100} key={number}>
              <article className="group h-full rounded-3xl border border-brand-blush bg-brand-ivory p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-gold/60 hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99] motion-reduce:transform-none sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-brand-gold shadow-lg shadow-primary/10 transition duration-300 group-hover:-rotate-3 group-hover:scale-105 motion-reduce:transform-none">
                    <Icon aria-hidden="true" size={20} />
                  </span>
                  <span className="font-title text-3xl font-semibold text-surface-hover">{number}</span>
                </div>
                <h3 className="mt-7 text-2xl text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
