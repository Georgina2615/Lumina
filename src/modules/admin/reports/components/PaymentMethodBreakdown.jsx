import { FiCreditCard, FiDollarSign, FiRepeat } from 'react-icons/fi';

// Formatea importes con moneda mexicana
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Define la presentación de cada forma de pago
const methodDefinitions = [
  {
    icon: FiDollarSign,
    id: 'efectivo',
    label: 'Efectivo',
    tone: 'bg-status-confirmed/15 text-status-confirmed'
  },
  {
    icon: FiCreditCard,
    id: 'tarjeta',
    label: 'Tarjeta',
    tone: 'bg-status-incabin/15 text-status-incabin'
  },
  {
    icon: FiRepeat,
    id: 'transferencia',
    label: 'Transferencia',
    tone: 'bg-status-pending/20 text-secondary'
  }
];

// Convierte centavos a moneda mexicana
const formatCurrency = (cents) => currencyFormatter.format((cents ?? 0) / 100);

// Calcula la participación sin dividir entre cero
const calculatePercentage = (amount, total) => (
  total > 0 ? Math.round((amount / total) * 100) : 0
);

// Muestra cuánto se recibió por cada forma de pago
export default function PaymentMethodBreakdown({
  methodTotals = {},
  totalReceivedCents = 0
}) {
  // Devuelve un panel legible sin confundir pagos mixtos
  return (
    <section
      aria-labelledby="payment-methods-title"
      className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm"
    >
      <header className="mb-4">
        <h2 className="text-xl text-primary" id="payment-methods-title">
          Formas de pago
        </h2>
        <p className="mt-1 text-xs text-muted">
          Los pagos mixtos se reparten entre las formas elegidas
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-3">
        {methodDefinitions.map((method) => {
          // Prepara la información visible de cada forma de pago
          const MethodIcon = method.icon;
          const amount = methodTotals[method.id] ?? 0;
          const percentage = calculatePercentage(amount, totalReceivedCents);

          // Devuelve el total y porcentaje de cada método
          return (
            <div
              className="rounded-2xl border border-surface-hover bg-background/55 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-secondary/30 motion-reduce:transform-none"
              key={method.id}
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${method.tone}`}>
                  <MethodIcon aria-hidden="true" size={18} />
                </span>
                <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-muted">
                  {percentage} %
                </span>
              </div>
              <dt className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {method.label}
              </dt>
              <dd className="mt-1 font-title text-2xl font-semibold tabular-nums text-primary">
                {formatCurrency(amount)}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
