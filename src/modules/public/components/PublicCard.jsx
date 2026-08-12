// Define la apariencia compartida de las tarjetas públicas
const baseClasses = 'group relative rounded-[1.75rem] border border-brand-blush bg-brand-ivory shadow-sm';

// Define la respuesta visual para tarjetas interactivas
const interactiveClasses = 'transition duration-300 hover:-translate-y-1 hover:border-brand-gold/70 hover:shadow-xl hover:shadow-brand-gold/10 active:scale-[0.99] motion-reduce:transform-none';

// Presenta una superficie visual reutilizable del módulo público
export default function PublicCard({
  as: Component = 'article',
  children,
  className = '',
  interactive = true
}) {
  // Combina la base con las necesidades de cada tarjeta
  const combinedClasses = `${baseClasses} ${interactive ? interactiveClasses : ''} ${className}`;

  // Devuelve la etiqueta solicitada con el mismo lenguaje visual
  return <Component className={combinedClasses}>{children}</Component>;
}
