import { useState } from 'react';

// Coordina los diálogos y resultados de la pantalla
export const useCabinInventoryOperations = (inventory) => {
  const [editor, setEditor] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [movement, setMovement] = useState(null);
  const [statusSupply, setStatusSupply] = useState(null);

  // Prepara una operación y limpia fallos anteriores
  const startOperation = (setter, value) => {
    inventory.clearMutationError();
    setFeedback(null);
    setter(value);
  };

  // Guarda un alta o una edición de metadatos
  const handleSupplySubmit = async ({ command }) => {
    if (editor) {
      await inventory.updateSupply({ command, supply: editor });
    } else {
      await inventory.createSupply(command);
    }

    setEditor(null);
    setFeedback({
      message: editor
        ? 'Insumo actualizado correctamente'
        : 'Insumo creado con inventario inicial',
      tone: 'success'
    });
  };

  // Registra la entrada o salida seleccionada
  const handleMovementSubmit = async ({ command }) => {
    await inventory.adjustStock({ command, supply: movement.supply });
    setMovement(null);
    setFeedback({
      message: 'Cantidad actualizada correctamente',
      tone: 'success'
    });
  };

  // Confirma la disponibilidad interna nueva
  const handleStatusConfirm = async () => {
    try {
      const nextActive = !statusSupply.active;
      await inventory.setSupplyActive(statusSupply, nextActive);
      setStatusSupply(null);
      setFeedback({
        message: nextActive
          ? 'Insumo reactivado para uso en cabina'
          : 'Insumo desactivado sin borrar sus registros anteriores',
        tone: 'success'
      });
    } catch {
      // Conserva la confirmación para reintentar
    }
  };

  const actions = {
    onAdjust: (supply) => startOperation(setMovement, {
      mode: 'adjust',
      supply
    }),
    onEdit: (supply) => startOperation(setEditor, supply),
    onReplenish: (supply) => startOperation(setMovement, {
      mode: 'replenish',
      supply
    }),
    onToggle: (supply) => startOperation(setStatusSupply, supply)
  };

  // Expone el estado visual y sus acciones
  return {
    actions,
    editor,
    feedback,
    handleMovementSubmit,
    handleStatusConfirm,
    handleSupplySubmit,
    movement,
    setEditor,
    setFeedback,
    setMovement,
    setStatusSupply,
    statusSupply,
    startOperation
  };
};
