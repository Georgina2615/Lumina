import { FiDroplet } from 'react-icons/fi';
import { formatCabinCurrency } from '../services/CabinInventoryPolicy';
import CabinSupplyActions from './CabinSupplyActions';
import CabinSupplyIdentity from './CabinSupplyIdentity';
import CabinSupplyStock from './CabinSupplyStock';

// Presenta un insumo en pantallas compactas
const CabinSupplyCard = ({ actions, supply }) => (
  <article className="rounded-2xl border border-surface-hover bg-surface p-4 shadow-sm transition duration-200 hover:border-secondary/30 hover:shadow-md">
    <CabinSupplyIdentity supply={supply} />
    <div className="my-4 grid grid-cols-2 gap-3 rounded-xl bg-background p-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
          Valor registrado
        </p>
        <p className="mt-1 font-semibold text-primary">
          {formatCabinCurrency(supply.inventoryValueCents)}
        </p>
      </div>
      <CabinSupplyStock detailed supply={supply} />
    </div>
    <CabinSupplyActions supply={supply} {...actions} />
  </article>
);

// Presenta los insumos en formato tabular amplio
const CabinSupplyTable = ({ actions, supplies }) => (
  <div className="hidden overflow-x-auto lg:block">
    <table className="w-full min-w-[980px] border-collapse text-left">
      <thead className="bg-background text-[11px] uppercase tracking-[0.12em] text-muted">
        <tr>
          <th className="px-5 py-3 font-semibold" scope="col">Insumo</th>
          <th className="px-4 py-3 font-semibold" scope="col">Valor registrado</th>
          <th className="px-4 py-3 text-right font-semibold" scope="col">Existencias</th>
          <th className="px-5 py-3 text-right font-semibold" scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-surface-hover">
        {supplies.map((supply) => (
          <tr
            className="transition-colors hover:bg-background/55"
            key={supply.id}
          >
            <td className="px-5 py-4">
              <CabinSupplyIdentity compact supply={supply} />
            </td>
            <td className="px-4 py-4 text-sm font-semibold text-primary">
              {formatCabinCurrency(supply.inventoryValueCents)}
            </td>
            <td className="px-4 py-4">
              <CabinSupplyStock supply={supply} />
            </td>
            <td className="px-5 py-4">
              <CabinSupplyActions compact supply={supply} {...actions} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Coordina estados y formatos de la colección
export default function CabinSupplyCollection({
  actions,
  loading,
  onReset,
  supplies,
  totalCount
}) {
  // Presenta esqueletos durante la primera carga
  if (loading) {
    return (
      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-1">
        {[1, 2, 3, 4].map((item) => (
          <div
            className="h-28 rounded-2xl bg-surface-hover/60 motion-safe:animate-pulse"
            key={item}
          />
        ))}
      </div>
    );
  }

  // Explica cuando no existen coincidencias
  if (supplies.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-5 py-10 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-muted">
          <FiDroplet aria-hidden="true" size={24} />
        </span>
        <h2 className="text-xl text-primary">
          {totalCount === 0 ? 'Inventario sin insumos' : 'Sin coincidencias'}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          {totalCount === 0
            ? 'Crea el primer insumo real para controlar el almacén de cabina'
            : 'Prueba otra búsqueda o restablece los filtros actuales'}
        </p>
        {totalCount > 0 && (
          <button
            className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-surface transition hover:-translate-y-0.5 hover:shadow-md"
            onClick={onReset}
            type="button"
          >
            Restablecer filtros
          </button>
        )}
      </div>
    );
  }

  // Devuelve tabla amplia y tarjetas compactas
  return (
    <>
      <CabinSupplyTable actions={actions} supplies={supplies} />
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">
        {supplies.map((supply) => (
          <CabinSupplyCard
            actions={actions}
            key={supply.id}
            supply={supply}
          />
        ))}
      </div>
    </>
  );
}
