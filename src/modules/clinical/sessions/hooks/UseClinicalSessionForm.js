import { useEffect, useRef, useState } from 'react';
import { getClinicalSessionCompletionError } from '../services/ClinicalSessionPolicy';
import { validateClinicalPhotoFile } from '../services/ClinicalSessionImageService';

// Coordina respuestas fotografías y validación del formulario
export const useClinicalSessionForm = ({
  initialSession,
  initialStatus,
  onSave,
  recordStatus
}) => {
  const [session, setSession] = useState(initialSession);
  const [files, setFiles] = useState({ after: null, before: null });
  const [previews, setPreviews] = useState({ after: '', before: '' });
  const [validationError, setValidationError] = useState('');
  const previewUrls = useRef([]);

  // Libera las fotografías temporales al salir
  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const changeField = (field, value) => {
    setSession((current) => ({ ...current, [field]: value }));
    setValidationError('');
  };

  const selectPhoto = (kind, file) => {
    if (!session.photoConsentGranted) {
      setValidationError('Registra la autorización antes de seleccionar fotografías');
      return;
    }
    const imageError = validateClinicalPhotoFile(file);
    if (imageError) {
      setValidationError(imageError);
      return;
    }

    const preview = URL.createObjectURL(file);
    previewUrls.current.push(preview);
    setFiles((current) => ({ ...current, [kind]: file }));
    setPreviews((current) => ({ ...current, [kind]: preview }));
    setValidationError('');
  };

  const saveDraft = () => onSave({
    files,
    session,
    status: initialStatus === 'completed' ? 'completed' : 'draft'
  });

  const completeSession = () => {
    const error = getClinicalSessionCompletionError({ recordStatus, session });
    if (error) {
      setValidationError(error);
      return;
    }
    onSave({ files, session, status: 'completed' });
  };

  return {
    changeField,
    completeSession,
    previews,
    saveDraft,
    selectPhoto,
    session,
    validationError
  };
};
