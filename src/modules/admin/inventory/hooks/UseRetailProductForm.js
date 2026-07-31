import { useEffect, useRef, useState } from 'react';
import {
  buildProductCommand,
  createProductFormState,
  validateProductForm
} from '../services/RetailInventoryPolicy';
import {
  validateRetailProductImageFile
} from '../services/RetailProductImageService';

// Controla datos validación e imagen del formulario
export const useRetailProductForm = ({ product, onSubmit }) => {
  const [form, setForm] = useState(() => createProductFormState(product));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.imageUrl ?? '');
  const [validationError, setValidationError] = useState(null);
  const localPreviewRef = useRef(null);
  const creating = !product;

  // Libera la vista temporal de la imagen local
  useEffect(() => {
    return () => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(localPreviewRef.current);
      }
    };
  }, []);

  // Crea la vista previa al seleccionar el archivo
  const selectImageFile = (file) => {
    const imageError = file ? validateRetailProductImageFile(file) : null;

    if (imageError) {
      setValidationError(imageError);
      return;
    }

    if (localPreviewRef.current) {
      URL.revokeObjectURL(localPreviewRef.current);
    }

    localPreviewRef.current = file ? URL.createObjectURL(file) : null;
    setImageFile(file);
    setImagePreview(localPreviewRef.current || product?.imageUrl || '');
    setValidationError(null);
  };

  // Actualiza un campo sin alterar el resto
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  // Valida y entrega el contrato canónico
  const submitForm = async () => {
    const nextError = validateProductForm(form, creating);

    if (nextError) {
      setValidationError(nextError);
      return;
    }

    try {
      await onSubmit({
        command: buildProductCommand(form, creating),
        imageFile
      });
    } catch {
      // Conserva el formulario para corregir o reintentar
    }
  };

  // Expone el estado mínimo del formulario
  return {
    creating,
    form,
    imageFile,
    imagePreview,
    selectImageFile,
    submitForm,
    updateField,
    validationError
  };
};
