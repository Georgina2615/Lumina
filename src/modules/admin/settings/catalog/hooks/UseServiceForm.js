import { useState } from 'react';
import {
  buildServiceCommand,
  createServiceFormState,
  validateServiceForm
} from '../services/AdminServiceCatalogPolicy';

// Controla datos y validacion del formulario
export const useServiceForm = ({ onSubmit, service }) => {
  const [form, setForm] = useState(() => createServiceFormState(service));
  const [validationError, setValidationError] = useState(null);
  const creating = !service;

  // Actualiza un campo sin alterar los demas
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  // Valida y entrega el contrato canonico
  const submitForm = async () => {
    const nextError = validateServiceForm(form);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    try {
      await onSubmit(buildServiceCommand(form));
    } catch {
      // Conserva el formulario para corregir o reintentar
    }
  };

  // Expone el estado minimo del formulario
  return {
    creating,
    form,
    submitForm,
    updateField,
    validationError
  };
};
