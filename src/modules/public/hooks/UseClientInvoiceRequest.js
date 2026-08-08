import { useCallback, useState } from 'react';
import {
  createClientInvoiceForm,
  validateClientInvoiceForm
} from '../services/ClientInvoicePolicy';
import { requestClientInvoice } from '../services/ClientInvoiceService';

// Coordina el formulario fiscal de una venta
export const useClientInvoiceRequest = ({ onCompleted }) => {
  const [sale, setSale] = useState(null);
  const [form, setForm] = useState(() => createClientInvoiceForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const open = useCallback((nextSale, email) => {
    setSale(nextSale);
    setForm(createClientInvoiceForm(email));
    setError('');
    setSuccess(false);
  }, []);

  const close = useCallback(() => {
    if (submitting) return;
    setSale(null);
    setError('');
    setSuccess(false);
  }, [submitting]);

  const updateField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }, []);

  const submit = useCallback(async () => {
    if (!sale || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = validateClientInvoiceForm(form, sale.id);
      await requestClientInvoice(payload);
      setSuccess(true);
      await onCompleted();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }, [form, onCompleted, sale, submitting]);

  return {
    close,
    error,
    form,
    open,
    sale,
    submit,
    submitting,
    success,
    updateField
  };
};
