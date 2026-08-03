import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import InventoryFeedback from '../../components/InventoryFeedback';
import CabinInventoryDialogs from '../components/CabinInventoryDialogs';
import CabinInventorySummary from '../components/CabinInventorySummary';
import CabinInventoryToolbar from '../components/CabinInventoryToolbar';
import CabinSupplyCollection from '../components/CabinSupplyCollection';
import { useCabinInventory } from '../hooks/UseCabinInventory';
import { useCabinInventoryFilters } from '../hooks/UseCabinInventoryFilters';
import {
  useCabinInventoryOperations
} from '../hooks/UseCabinInventoryOperations';

// Presenta la administración del inventario de cabina
export default function AdminCabinInventory() {
  const inventory = useCabinInventory();
  const filters = useCabinInventoryFilters(inventory.supplies);
  const operations = useCabinInventoryOperations(inventory);

  // Devuelve la pantalla con operaciones aisladas
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">
            Inventario de cabina
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
            Control de insumos profesionales, costos privados y movimientos auditables
          </p>
        </div>
        <p className="rounded-full border border-surface-hover bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
          Sucursal principal
        </p>
      </header>

      <InventoryFeedback
        feedback={operations.feedback}
        onClose={() => operations.setFeedback(null)}
      />

      {inventory.costsUnavailable && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-primary">
          <FiAlertTriangle
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-secondary"
          />
          <p>
            Los insumos están disponibles, pero sus costos privados no pudieron consultarse
          </p>
        </div>
      )}

      {inventory.error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-error/20 bg-error/10 px-4 py-3">
          <p className="text-sm font-medium text-error" role="alert">
            {inventory.error}
          </p>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-surface"
            onClick={inventory.refreshInventory}
            type="button"
          >
            <FiRefreshCw aria-hidden="true" />
            Reintentar
          </button>
        </div>
      )}

      <CabinInventorySummary
        costsUnavailable={inventory.costsUnavailable}
        loading={inventory.isLoading}
        supplies={inventory.supplies}
        unavailable={Boolean(inventory.error && inventory.supplies.length === 0)}
      />

      <CabinInventoryToolbar
        activityFilter={filters.activityFilter}
        categories={filters.categories}
        categoryFilter={filters.categoryFilter}
        isRefreshing={inventory.isRefreshing}
        onActivityChange={filters.setActivityFilter}
        onCategoryChange={filters.setCategoryFilter}
        onCreate={() => operations.startOperation(operations.setEditor, false)}
        onRefresh={inventory.refreshInventory}
        onReset={filters.resetFilters}
        onSearchChange={filters.setSearch}
        onStockChange={filters.setStockFilter}
        onUnitChange={filters.setUnitFilter}
        search={filters.search}
        stockFilter={filters.stockFilter}
        unitFilter={filters.unitFilter}
      />

      {(!inventory.error || inventory.supplies.length > 0) && (
        <section className="overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm">
          <header className="flex items-center justify-between border-b border-surface-hover px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-lg text-primary">Almacén de uso interno</h2>
              <p className="text-xs text-muted">
                {filters.filteredSupplies.length} de {inventory.supplies.length} insumos
              </p>
            </div>
          </header>
          <CabinSupplyCollection
            actions={operations.actions}
            loading={inventory.isLoading}
            onReset={filters.resetFilters}
            supplies={filters.filteredSupplies}
            totalCount={inventory.supplies.length}
          />
        </section>
      )}

      <CabinInventoryDialogs
        busy={inventory.isMutating}
        categories={filters.categories}
        editor={operations.editor}
        error={inventory.mutationError}
        movement={operations.movement}
        onCloseEditor={() => !inventory.isMutating && operations.setEditor(null)}
        onCloseMovement={() => !inventory.isMutating && operations.setMovement(null)}
        onCloseStatus={() => !inventory.isMutating && operations.setStatusSupply(null)}
        onMovementSubmit={operations.handleMovementSubmit}
        onStatusConfirm={operations.handleStatusConfirm}
        onSupplySubmit={operations.handleSupplySubmit}
        statusSupply={operations.statusSupply}
      />
    </div>
  );
}
