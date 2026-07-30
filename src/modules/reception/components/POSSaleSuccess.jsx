import { FiCheckCircle } from 'react-icons/fi';

// Presenta el resultado confirmado de la función
export default function POSSaleSuccess({ result, onFinish }) {
  // Normaliza alertas recibidas
  const warnings = Array.isArray(result.inventoryWarnings)
    ? result.inventoryWarnings
    : [];

  // Devuelve la confirmación final
  return (
    <div className="p-6 text-center sm:p-8">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-confirmed/15 text-status-confirmed">
        <FiCheckCircle aria-hidden="true" className="text-3xl" />
      </div>
      <h2
        id="checkout-title"
        data-dialog-initial-focus
        tabIndex={-1}
        className="mt-4 text-2xl text-primary outline-none"
      >
        {result.alreadyProcessed ? 'Venta ya registrada' : 'Venta registrada'}
      </h2>
      <p className="mt-1 text-sm text-muted">Folio {result.folio}</p>
      {warnings.length > 0 && (
        <div className="mt-5 rounded-xl border border-status-pending/30 bg-status-pending/10 p-3 text-left">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Alertas de inventario
          </p>
          <ul className="mt-2 space-y-1 text-sm text-primary">
            {warnings.map((warning) => (
              <li key={warning.productId}>
                {warning.name} quedó en {warning.remainingStock} unidades
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onFinish}
        className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
      >
        Volver al panel
      </button>
    </div>
  );
}
