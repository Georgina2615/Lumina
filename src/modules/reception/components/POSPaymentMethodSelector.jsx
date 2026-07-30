import {
  FiCreditCard,
  FiDollarSign,
  FiRepeat
} from 'react-icons/fi';

// Define métodos autorizados
const paymentMethods = [
  { id: 'efectivo', label: 'Efectivo', Icon: FiDollarSign },
  { id: 'tarjeta', label: 'Tarjeta', Icon: FiCreditCard },
  { id: 'transferencia', label: 'Transferencia', Icon: FiRepeat },
  { id: 'mixto', label: 'Mixto', Icon: FiRepeat }
];

// Presenta las formas de pago autorizadas
export default function POSPaymentMethodSelector({ value, onChange }) {
  // Devuelve opciones táctiles
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-secondary">
        Forma de pago
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {paymentMethods.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-semibold transition duration-200 ${
              value === id
                ? 'border-primary bg-primary text-surface shadow-sm'
                : 'border-surface-hover bg-background text-muted hover:border-primary/40 hover:text-primary'
            }`}
          >
            <Icon aria-hidden="true" className="text-xl" />
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
