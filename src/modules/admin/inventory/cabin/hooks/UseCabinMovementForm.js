import { useState } from 'react';
import {
  buildCabinMovementCommand,
  isCabinStockEntry,
  validateCabinMovement
} from '../services/CabinInventoryPolicy';

// Controla la captura de un movimiento auditable
export const useCabinMovementForm = ({ mode, onSubmit, supply }) => {
  const [form, setForm] = useState({
    quantity: '',
    reason: '',
    reference: '',
    totalCost: '',
    type: mode === 'replenish'
      ? 'entrada_reabastecimiento'
      : 'ajuste_negativo'
  });
  const [validationError, setValidationError] = useState(null);

  // Actualiza un dato y limpia valores incompatibles
  const updateField = (field, value) => {
    setForm((current) => {
      if (field === 'type' && !isCabinStockEntry(value)) {
        return { ...current, [field]: value, totalCost: '' };
      }

      return { ...current, [field]: value };
    });
    setValidationError(null);
  };

  // Valida y entrega el movimiento canónico
  const submitForm = async () => {
    const nextError = validateCabinMovement(form, supply);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    try {
      await onSubmit({
        command: buildCabinMovementCommand(form, supply.unit)
      });
    } catch {
      // Conserva el movimiento para corregir o reintentar
    }
  };

  // Expone datos y acciones del formulario
  return {
    form,
    submitForm,
    updateField,
    validationError
  };
};
