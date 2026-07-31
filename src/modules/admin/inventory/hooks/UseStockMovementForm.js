import { useState } from 'react';
import {
  buildStockMovementCommand,
  validateStockMovement
} from '../services/RetailInventoryPolicy';

// Controla la captura de un movimiento auditado
export const useStockMovementForm = ({ mode, product, onSubmit }) => {
  const [form, setForm] = useState({
    quantity: '',
    reason: '',
    reference: '',
    type: mode === 'replenish'
      ? 'entrada_reabastecimiento'
      : 'ajuste_negativo',
    unitCost: ''
  });
  const [validationError, setValidationError] = useState(null);

  // Actualiza un dato y limpia valores incompatibles
  const updateField = (field, value) => {
    setForm((current) => {
      if (field === 'type' && ![
        'entrada_reabastecimiento',
        'ajuste_positivo'
      ].includes(value)) {
        return { ...current, [field]: value, unitCost: '' };
      }

      return { ...current, [field]: value };
    });
    setValidationError(null);
  };

  // Valida y entrega el movimiento canónico
  const submitForm = async () => {
    const nextError = validateStockMovement(form, product);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    try {
      await onSubmit({ command: buildStockMovementCommand(form) });
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
