import { useState } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import InventoryDialogs from '../components/InventoryDialogs';
import InventoryFeedback from '../components/InventoryFeedback';
import InventorySummary from '../components/InventorySummary';
import InventoryToolbar from '../components/InventoryToolbar';
import RetailProductCollection from '../components/RetailProductCollection';
import { useRetailInventory } from '../hooks/UseRetailInventory';
import { useRetailInventoryFilters } from '../hooks/UseRetailInventoryFilters';

// Presenta la administración completa del inventario retail
export default function AdminRetailInventory() {
  const inventory = useRetailInventory();
  const filters = useRetailInventoryFilters(inventory.products);
  const [editor, setEditor] = useState(null);
  const [movement, setMovement] = useState(null);
  const [statusProduct, setStatusProduct] = useState(null);
  const [feedback, setFeedback] = useState(null);
  // Prepara una operación y limpia fallos anteriores
  const startOperation = (setter, value) => {
    inventory.clearMutationError();
    setFeedback(null);
    setter(value);
  };
  // Guarda un alta o una edición comercial
  const handleProductSubmit = async (payload) => {
    const outcome = editor
      ? await inventory.updateProduct({ ...payload, product: editor })
      : await inventory.createProduct(payload);
    setEditor(null);
    setFeedback({
      message: outcome.imageWarning
        || (editor ? 'Producto actualizado correctamente' : 'Producto creado correctamente'),
      tone: outcome.imageWarning ? 'warning' : 'success'
    });
  };
  // Registra la entrada o salida seleccionada
  const handleMovementSubmit = async ({ command }) => {
    await inventory.adjustStock({ command, product: movement.product });
    setMovement(null);
    setFeedback({
      message: 'Movimiento de existencias registrado correctamente',
      tone: 'success'
    });
  };
  // Confirma la disponibilidad comercial nueva
  const handleStatusConfirm = async () => {
    try {
      await inventory.setProductActive(statusProduct, !statusProduct.active);
      const nextActive = !statusProduct.active;
      setStatusProduct(null);
      setFeedback({
        message: nextActive
          ? 'Producto reactivado para Punto de Venta'
          : 'Producto desactivado sin eliminar su historial',
        tone: 'success'
      });
    } catch {
      // Conserva la confirmación para reintentar
    }
  };
  const actions = {
    onAdjust: (product) => startOperation(setMovement, {
      mode: 'adjust',
      product
    }),
    onEdit: (product) => startOperation(setEditor, product),
    onReplenish: (product) => startOperation(setMovement, {
      mode: 'replenish',
      product
    }),
    onToggle: (product) => startOperation(setStatusProduct, product)
  };
  // Devuelve la pantalla y sus operaciones modales
  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
            Administración
          </p>
          <h1 className="text-3xl text-primary sm:text-4xl">Inventario retail</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted sm:text-base">
            Control de productos para venta costos privados y movimientos auditables
          </p>
        </div>
        <p className="rounded-full border border-surface-hover bg-surface px-3 py-1.5 text-xs font-semibold text-muted">
          Sucursal principal
        </p>
      </header>

      <InventoryFeedback
        feedback={feedback}
        onClose={() => setFeedback(null)}
      />

      {inventory.costsUnavailable && (
        <div className="flex items-start gap-3 rounded-2xl border border-status-pending/40 bg-status-pending/10 px-4 py-3 text-sm text-primary">
          <FiAlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-secondary" />
          <p>
            El catálogo está disponible pero los costos privados no pudieron consultarse
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

      <InventorySummary
        loading={inventory.isLoading}
        products={inventory.products}
      />

      <InventoryToolbar
        activityFilter={filters.activityFilter}
        categories={filters.categories}
        categoryFilter={filters.categoryFilter}
        isRefreshing={inventory.isRefreshing}
        onActivityChange={filters.setActivityFilter}
        onCategoryChange={filters.setCategoryFilter}
        onCreate={() => startOperation(setEditor, false)}
        onRefresh={inventory.refreshInventory}
        onReset={filters.resetFilters}
        onSearchChange={filters.setSearch}
        onStockChange={filters.setStockFilter}
        search={filters.search}
        stockFilter={filters.stockFilter}
      />

      {(!inventory.error || inventory.products.length > 0) && (
        <section className="overflow-hidden rounded-2xl border border-surface-hover bg-surface shadow-sm">
          <header className="flex items-center justify-between border-b border-surface-hover px-4 py-3 sm:px-5">
            <div>
              <h2 className="text-lg text-primary">Catálogo de productos</h2>
              <p className="text-xs text-muted">
                {filters.filteredProducts.length} de {inventory.products.length} productos
              </p>
            </div>
          </header>
          <RetailProductCollection
            actions={actions}
            loading={inventory.isLoading}
            onReset={filters.resetFilters}
            products={filters.filteredProducts}
            totalCount={inventory.products.length}
          />
        </section>
      )}

      <InventoryDialogs
        busy={inventory.isMutating}
        categories={filters.categories}
        editor={editor}
        error={inventory.mutationError}
        movement={movement}
        onCloseEditor={() => !inventory.isMutating && setEditor(null)}
        onCloseMovement={() => !inventory.isMutating && setMovement(null)}
        onCloseStatus={() => !inventory.isMutating && setStatusProduct(null)}
        onMovementSubmit={handleMovementSubmit}
        onProductSubmit={handleProductSubmit}
        onStatusConfirm={handleStatusConfirm}
        statusProduct={statusProduct}
      />
    </div>
  );
}
