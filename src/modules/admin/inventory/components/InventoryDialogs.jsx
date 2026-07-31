import ProductStatusDialog from './ProductStatusDialog';
import RetailProductFormModal from './RetailProductFormModal';
import StockMovementModal from './StockMovementModal';

// Agrupa las operaciones modales de la pantalla
export default function InventoryDialogs({
  busy,
  categories,
  editor,
  error,
  movement,
  onCloseEditor,
  onCloseMovement,
  onCloseStatus,
  onProductSubmit,
  onMovementSubmit,
  onStatusConfirm,
  statusProduct
}) {
  // Devuelve únicamente el diálogo operativo vigente
  return (
    <>
      <RetailProductFormModal
        busy={busy}
        categories={categories}
        error={error}
        key={editor?.id ?? (editor === false ? 'new' : 'closed')}
        onClose={onCloseEditor}
        onSubmit={onProductSubmit}
        open={editor !== null}
        product={editor || null}
      />

      {movement && (
        <StockMovementModal
          busy={busy}
          error={error}
          key={`${movement.product.id}-${movement.mode}`}
          mode={movement.mode}
          onClose={onCloseMovement}
          onSubmit={onMovementSubmit}
          product={movement.product}
        />
      )}

      <ProductStatusDialog
        busy={busy}
        error={error}
        onClose={onCloseStatus}
        onConfirm={onStatusConfirm}
        product={statusProduct}
      />
    </>
  );
}
