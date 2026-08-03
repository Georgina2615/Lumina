import { useState } from 'react';
import {
  buildCabinSupplyCommand,
  createCabinSupplyFormState,
  validateCabinSupplyForm
} from '../services/CabinInventoryPolicy';

// Controla datos y validación del formulario
export const useCabinSupplyForm = ({ onSubmit, supply }) => {
  const [form, setForm] = useState(() => createCabinSupplyFormState(supply));
  const [validationError, setValidationError] = useState(null);
  const creating = !supply;

  // Actualiza un campo sin alterar el resto
  const updateField = (field, value) => {
    setForm((current) => {
      if (field === 'unit') {
        return {
          ...current,
          initialQuantity: '',
          minimumStock: '',
          unit: value
        };
      }

      return { ...current, [field]: value };
    });
    setValidationError(null);
  };

  // Valida y entrega el contrato canónico
  const submitForm = async () => {
    const nextError = validateCabinSupplyForm(form, creating);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    try {
      await onSubmit({
        command: buildCabinSupplyCommand(form, creating)
      });
    } catch {
      // Conserva el formulario para corregir o reintentar
    }
  };

  // Expone el estado mínimo del formulario
  return {
    creating,
    form,
    submitForm,
    updateField,
    validationError
  };
};
