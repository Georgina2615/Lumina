import { useScrollReveal } from '../hooks/UseScrollReveal';

// Define movimientos breves para cada composicion
const hiddenVariants = {
  fade: 'opacity-0',
  left: '-translate-x-5 opacity-0',
  right: 'translate-x-5 opacity-0',
  scale: 'scale-[0.97] opacity-0',
  up: 'translate-y-6 opacity-0'
};

// Define demoras reutilizables reconocidas por Tailwind
const delayClasses = {
  0: '',
  75: 'delay-75',
  100: 'delay-100',
  150: 'delay-150',
  200: 'delay-200',
  300: 'delay-300'
};

// Presenta contenido cuando entra en pantalla
export default function Reveal({
  as: Component = 'div',
  children,
  className = '',
  delay = 0,
  variant = 'up'
}) {
  const { elementRef, isVisible } = useScrollReveal();
  const hiddenClassName = hiddenVariants[variant] || hiddenVariants.up;
  const delayClassName = delayClasses[delay] || '';

  // Devuelve una transicion que respeta movimiento reducido
  return (
    <Component
      className={`${className} transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:opacity-100 ${delayClassName} ${isVisible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : hiddenClassName}`}
      ref={elementRef}
    >
      {children}
    </Component>
  );
}
