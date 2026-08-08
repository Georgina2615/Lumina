import { FiCheckCircle, FiClock, FiFileText } from 'react-icons/fi';

const cards = [
  { icon: FiClock, key: 'pendiente', label: 'Pendientes', tone: 'text-status-pending' },
  { icon: FiFileText, key: 'preparada', label: 'Preparadas', tone: 'text-secondary' },
  { icon: FiCheckCircle, key: 'entregada', label: 'Atendidas', tone: 'text-status-confirmed' }
];

// Presenta el avance general de las solicitudes
export default function AdminInvoiceSummary({ summary }) {
  return (
    <section aria-label="Resumen de facturas" className="grid gap-3 sm:grid-cols-3">
      {cards.map(({ icon: Icon, key, label, tone }) => (
        <article
          className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm"
          key={key}
        >
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-background ${tone}`}>
            <Icon aria-hidden="true" />
          </span>
          <p className="mt-4 font-title text-3xl font-semibold text-primary">
            {summary[key]}
          </p>
          <p className="text-sm text-muted">{label}</p>
        </article>
      ))}
    </section>
  );
}
