import { FiFileText } from 'react-icons/fi';
import ClientSaleCard from './ClientSaleCard';

// Presenta las ventas terminadas de la clienta
export default function ClientSaleList({ email, onRequestInvoice, sales }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl">Compras y facturas</h2>
          <p className="mt-1 text-sm text-muted">Solicita factura de tus pagos terminados</p>
        </div>
        <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">{sales.length}</span>
      </div>
      {sales.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {sales.map((sale) => <ClientSaleCard email={email} key={sale.id} onRequestInvoice={onRequestInvoice} sale={sale} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-surface-hover bg-surface/60 px-6 py-10 text-center">
          <FiFileText aria-hidden="true" className="mx-auto text-muted" size={25} />
          <p className="mt-3 text-sm text-muted">Las compras terminadas aparecerán aquí</p>
        </div>
      )}
    </section>
  );
}
