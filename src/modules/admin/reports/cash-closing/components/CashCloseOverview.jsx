import { FiCreditCard, FiDollarSign, FiRepeat, FiTrendingUp } from 'react-icons/fi';
import AdminMetricCard from '../../../dashboard/components/AdminMetricCard';
import { formatCashCloseCurrency } from '../services/AdminCashClosePolicy';

// Presenta los cobros registrados del dia
export default function CashCloseOverview({ day }) {
  const methods = day?.paymentTotals ?? {};
  const metrics = [
    {
      description: 'Suma de anticipos y pagos finales',
      icon: FiTrendingUp,
      label: 'Total cobrado',
      value: formatCashCloseCurrency(day?.totalCents)
    },
    {
      description: 'Dinero que debe estar en caja',
      icon: FiDollarSign,
      label: 'Cobros en efectivo',
      value: formatCashCloseCurrency(methods.efectivo)
    },
    {
      description: 'Cobros registrados con tarjeta',
      icon: FiCreditCard,
      label: 'Tarjeta',
      value: formatCashCloseCurrency(methods.tarjeta)
    },
    {
      description: 'Cobros registrados por transferencia',
      icon: FiRepeat,
      label: 'Transferencia',
      value: formatCashCloseCurrency(methods.transferencia)
    }
  ];

  return (
    <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <AdminMetricCard
          description={metric.description}
          icon={metric.icon}
          key={metric.label}
          label={metric.label}
          value={metric.value}
        />
      ))}
    </dl>
  );
}
