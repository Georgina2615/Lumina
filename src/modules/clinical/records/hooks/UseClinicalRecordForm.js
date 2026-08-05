import { useState } from 'react';
import { getClinicalCompletionError } from '../services/ClinicalRecordPolicy';

// Controla los pasos y respuestas del formulario
export const useClinicalRecordForm = ({ initialRecord, initialStatus, onSave }) => {
  const [record, setRecord] = useState(initialRecord);
  const [step, setStep] = useState(0);
  const [validationError, setValidationError] = useState(null);

  // Cambia una respuesta simple
  const changeField = (section, field, value) => {
    setValidationError(null);
    setRecord((current) => ({
      ...current,
      [section]: { ...current[section], [field]: value }
    }));
  };

  // Alterna una opción dentro de una lista
  const toggleOption = (section, field, value) => {
    const currentValues = record[section][field];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    changeField(section, field, nextValues);
  };

  // Guarda sin exigir que la ficha esté terminada
  const saveDraft = () => onSave({
    record,
    status: initialStatus === 'completed' ? 'completed' : 'draft'
  });

  // Valida y completa la ficha
  const completeRecord = () => {
    const error = getClinicalCompletionError(record);

    if (error) {
      setValidationError(error);
      return;
    }

    onSave({ record, status: 'completed' });
  };

  return {
    changeField,
    completeRecord,
    record,
    saveDraft,
    setStep,
    step,
    toggleOption,
    validationError
  };
};
