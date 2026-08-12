import { useCallback, useEffect, useState } from 'react';
import {
  buildUserCommand,
  createUserFormState,
  validateUserForm
} from '../services/AdminUsersPolicy';

export const useUserForm = ({ onSubmit, user }) => {
  const [form, setForm] = useState(createUserFormState(user));
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    setForm(createUserFormState(user));
    setValidationError(null);
  }, [user]);

  const updateField = useCallback((field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }, []);

  const submitForm = useCallback(async () => {
    const error = validateUserForm(form);

    if (error) {
      setValidationError(error);
      return null;
    }

    setValidationError(null);
    return onSubmit(buildUserCommand(form));
  }, [form, onSubmit]);

  return {
    creating: !user,
    form,
    submitForm,
    updateField,
    validationError
  };
};
