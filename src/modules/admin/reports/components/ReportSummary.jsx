import {
  FiCheckCircle,
  FiDollarSign,
  FiPocket,
  FiShoppingBag
} from 'react-icons/fi';
import AdminMetricCard from '../../dashboard/components/AdminMetricCard';

// Formatea importes con moneda mexicana
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Convierte centavos a moneda mexicana
const formatCurrency = (cents) => currencyFormatter.format((cents ?? 0) / 100);

// Presenta los totales principales del periodo
export default function ReportSummary({ report = {} }) {
  // Define las métricas recibidas por la pantalla
  const metrics = [
    {
      description: 'Suma de todos los cobros del periodo',
      icon: FiDollarSign,
      label: 'Total recibido',
      value: formatCurrency(report.totalReceivedCents)
    },
    {
      description: 'Pagos que reservaron una cita',
      icon: FiPocket,
      label: 'Anticipos recibidos',
      value: formatCurrency(report.depositCents)
    },
    {
      description: 'Pagos realizados al terminar la atención',
      icon: FiCheckCircle,
      label: 'Pagos finales recibidos',
      value: formatCurrency(report.finalPaymentCents)
    },
    {
      description: 'Ventas que quedaron completamente cobradas',
      icon: FiShoppingBag,
      label: 'Ventas terminadas',
      value: report.salesCount ?? 0
    }
  ];

  // Devuelve una cuadrícula adaptable de métricas
  return (
    <dl
      aria-label="Resumen de cobros y ventas"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
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
