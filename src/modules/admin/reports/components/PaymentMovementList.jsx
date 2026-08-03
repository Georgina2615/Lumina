import { FiFileText } from 'react-icons/fi';

// Conserva la zona horaria del negocio
const businessTimeZone = 'America/Mexico_City';

// Formatea importes con moneda mexicana
const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Formatea fechas con la zona horaria del negocio
const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: businessTimeZone
});

// Traduce las formas de pago guardadas
const methodLabels = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia'
};

// Traduce los tipos de cobro guardados
const typeLabels = {
  anticipo: 'Anticipo',
  liquidacion: 'Pago final'
};

// Convierte centavos a moneda mexicana
const formatCurrency = (cents) => currencyFormatter.format((cents ?? 0) / 100);

// Presenta fecha y hora con el horario del negocio
const formatDate = (date) => dateFormatter.format(date);

// Traduce las formas de pago conocidas
const formatMethods = (methods = []) => methods
  .map((method) => methodLabels[method] || method)
  .join(' y ') || 'Sin forma de pago';

// Presenta un cobro en pantallas compactas
const PaymentMovementCard = ({ payment }) => (
  <article className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <span className="inline-flex rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-secondary">
          {typeLabels[payment.type] || 'Cobro'}
        </span>
        <h3 className="mt-3 truncate font-semibold text-primary">
          {payment.clientName || 'Cliente sin nombre'}
        </h3>
        <time
          className="mt-1 block text-xs text-muted"
          dateTime={payment.paidAt.toISOString()}
        >
          {formatDate(payment.paidAt)}
        </time>
      </div>
      <p className="shrink-0 font-title text-xl font-semibold tabular-nums text-primary">
        {formatCurrency(payment.amountCents)}
      </p>
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-background p-3 text-xs">
      <div>
        <dt className="font-semibold uppercase tracking-wider text-muted">Forma de pago</dt>
        <dd className="mt-1 text-primary">{formatMethods(payment.methods)}</dd>
      </div>
      <div>
        <dt className="font-semibold uppercase tracking-wider text-muted">Referencia</dt>
        <dd className="mt-1 break-all text-primary">{payment.reference || 'Sin referencia'}</dd>
      </div>
    </dl>
  </article>
);

// Presenta cobros en tabla y tarjetas adaptables
export default function PaymentMovementList({ payments = [] }) {
  // Explica cuando no existen cobros en el periodo
  if (payments.length === 0) {
    return (
      <section
        aria-labelledby="payment-movements-title"
        className="rounded-2xl border border-surface-hover bg-surface p-5 shadow-sm"
      >
        <h2 className="text-xl text-primary" id="payment-movements-title">
          Movimientos
        </h2>
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted">
            <FiFileText aria-hidden="true" size={22} />
          </span>
          <p className="mt-4 font-semibold text-primary">
            No hay cobros en este periodo
          </p>
        </div>
      </section>
    );
  }

  // Devuelve el historial del periodo seleccionado
  return (
    <section
      aria-labelledby="payment-movements-title"
      className="overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm"
    >
      <header className="flex items-center justify-between gap-4 border-b border-surface-hover px-5 py-4">
        <h2 className="text-xl text-primary" id="payment-movements-title">
          Movimientos
        </h2>
        <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-muted">
          {payments.length} {payments.length === 1 ? 'cobro' : 'cobros'}
        </span>
      </header>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="bg-background text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-4 py-3 font-semibold">Cliente</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Forma de pago</th>
              <th className="px-4 py-3 font-semibold">Referencia</th>
              <th className="px-5 py-3 text-right font-semibold">Cantidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-hover">
            {payments.map((payment) => (
              <tr className="transition-colors hover:bg-background/55" key={payment.id}>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-muted">
                  <time dateTime={payment.paidAt.toISOString()}>
                    {formatDate(payment.paidAt)}
                  </time>
                </td>
                <td className="max-w-64 truncate px-4 py-4 text-sm font-semibold text-primary">
                  {payment.clientName || 'Cliente sin nombre'}
                </td>
                <td className="px-4 py-4 text-sm text-primary">
                  {typeLabels[payment.type] || 'Cobro'}
                </td>
                <td className="px-4 py-4 text-sm text-muted">
                  {formatMethods(payment.methods)}
                </td>
                <td className="max-w-48 truncate px-4 py-4 text-sm text-muted">
                  {payment.reference || 'Sin referencia'}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right font-semibold tabular-nums text-primary">
                  {formatCurrency(payment.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
        {payments.map((payment) => (
          <PaymentMovementCard key={payment.id} payment={payment} />
        ))}
      </div>
    </section>
  );
}
