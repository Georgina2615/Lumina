import { useEffect, useMemo, useState } from 'react';
import {
  confirmPublicBookingPayment
} from '../services/PublicBookingService';

// Obtiene el regreso seguro desde Mercado Pago
const getPaymentReturn = () => {
  const params = new URLSearchParams(globalThis.location.search);
  const sessionId = params.get('payment_session') ?? '';
  const accessKey = params.get('payment_key') ?? '';
  return sessionId && accessKey ? {
    sessionId,
    accessKey,
    paymentId: params.get('payment_id') || params.get('collection_id') || ''
  } : null;
};

// Recupera el resumen conservado antes de salir
const getStoredFields = (sessionId) => {
  if (!sessionId) return {};
  const storageKey = `lumina-payment-${sessionId}`;
  const stored = sessionStorage.getItem(storageKey);
  if (!stored) return {};
  try {
    return JSON.parse(stored).fields ?? {};
  } catch {
    sessionStorage.removeItem(storageKey);
    return {};
  }
};

// Controla la comprobación al volver del pago
export const usePublicPaymentReturn = () => {
  const paymentReturn = useMemo(() => getPaymentReturn(), []);
  const fields = useMemo(
    () => getStoredFields(paymentReturn?.sessionId),
    [paymentReturn]
  );
  const [result, setResult] = useState(
    paymentReturn ? { status: 'checking' } : null
  );

  // Consulta el estado real una sola vez
  useEffect(() => {
    let active = true;
    if (!paymentReturn) return undefined;

    confirmPublicBookingPayment(paymentReturn)
      .then((response) => active && setResult(response))
      .catch((error) => active && setResult({
        status: 'error',
        message: error.message
      }));
    return () => { active = false; };
  }, [paymentReturn]);

  return {
    fields,
    result,
    returning: Boolean(paymentReturn)
  };
};
