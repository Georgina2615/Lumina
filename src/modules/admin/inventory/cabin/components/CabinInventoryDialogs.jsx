import CabinMovementModal from './CabinMovementModal';
import CabinSupplyFormModal from './CabinSupplyFormModal';
import CabinSupplyStatusDialog from './CabinSupplyStatusDialog';

// Monta solamente la operación activa
export default function CabinInventoryDialogs({
  busy,
  categories,
  editor,
  error,
  movement,
  onCloseEditor,
  onCloseMovement,
  onCloseStatus,
  onMovementSubmit,
  onStatusConfirm,
  onSupplySubmit,
  statusSupply
}) {
  // Devuelve diálogos aislados para reiniciar sus formularios
  return (
    <>
      {editor !== null && (
        <CabinSupplyFormModal
          busy={busy}
          categories={categories}
          error={error}
          key={editor?.id ?? 'new-cabin-supply'}
          onClose={onCloseEditor}
          onSubmit={onSupplySubmit}
          supply={editor || null}
        />
      )}
      {movement && (
        <CabinMovementModal
          busy={busy}
          error={error}
          key={`${movement.supply.id}-${movement.mode}`}
          mode={movement.mode}
          onClose={onCloseMovement}
          onSubmit={onMovementSubmit}
          supply={movement.supply}
        />
      )}
      {statusSupply && (
        <CabinSupplyStatusDialog
          busy={busy}
          error={error}
          onClose={onCloseStatus}
          onConfirm={onStatusConfirm}
          supply={statusSupply}
        />
      )}
    </>
  );
}
