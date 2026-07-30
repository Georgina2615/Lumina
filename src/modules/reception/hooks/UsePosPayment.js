import { useMemo, useState } from 'react';
import {
  createPaymentPayload,
  getPaymentPreview
} from '../services/SaleCalculationService';

// Define una captura limpia
const initialPaymentForm = Object.freeze({
  method: 'efectivo',
  primaryMethod: 'efectivo',
  secondaryMethod: 'tarjeta',
  primaryAmount: '',
  cashReceived: '',
  cardReference: '',
  cardLastFour: '',
  transferReference: ''
});

// Controla la captura de pagos sin ejecutar escrituras
export const usePOSPayment = (amountDueCents, restoredForm = null) => {
  // Conserva la captura vigente
  const [paymentForm, setPaymentForm] = useState(() => (
    restoredForm
      ? { ...initialPaymentForm, ...restoredForm }
      : initialPaymentForm
  ));

  // Calcula importes auxiliares
  const paymentPreview = useMemo(() => getPaymentPreview({
    form: paymentForm,
    amountDueCents
  }), [amountDueCents, paymentForm]);

  // Actualiza un campo del formulario
  const updatePaymentField = (field, value) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  };

  // Selecciona una forma de pago
  const selectPaymentMethod = (method) => {
    setPaymentForm((current) => ({ ...current, method }));
  };

  // Restablece los datos sensibles al cerrar
  const resetPayment = () => {
    setPaymentForm(initialPaymentForm);
  };

  // Produce el contrato final validado
  const buildPayments = () => createPaymentPayload({
    form: paymentForm,
    amountDueCents
  });

  // Devuelve controles de la captura
  return {
    buildPayments,
    paymentForm,
    paymentPreview,
    resetPayment,
    selectPaymentMethod,
    updatePaymentField
  };
};
