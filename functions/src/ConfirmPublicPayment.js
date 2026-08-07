import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import { finalizePublicPayment } from './FinalizePublicPayment.js';
import { getMercadoPagoPayment } from './MercadoPagoClient.js';
import { requirePublicPaymentAccess } from './PublicPaymentPolicy.js';

// Normaliza un identificador de pago opcional
const normalizePaymentId = (value) => {
  const normalized = String(value ?? '').trim();
  if (normalized && !/^\d{1,40}$/.test(normalized)) {
    throw new AppointmentError('invalid-argument', 'El identificador del pago no es válido');
  }
  return normalized;
};

// Convierte fallos conocidos en respuestas seguras
const mapError = (error) => error instanceof AppointmentError
  ? new HttpsError(error.code, error.message)
  : new HttpsError('internal', 'No se pudo consultar el pago');

// Consulta y confirma un pago al volver al sitio
export const confirmPublicPaymentHandler = async ({
  accessToken,
  data,
  firestore
}) => {
  try {
    const sessionId = String(data?.sessionId ?? '').trim();
    if (!sessionId || sessionId.includes('/') || sessionId.length > 500) {
      throw new AppointmentError('invalid-argument', 'La reservación no es válida');
    }
    const sessionSnapshot = await firestore.collection('sesionesPagoPublicas')
      .doc(sessionId).get();
    if (!sessionSnapshot.exists) {
      throw new AppointmentError('not-found', 'La reservación no existe');
    }
    requirePublicPaymentAccess({
      accessKey: data?.accessKey,
      storedHash: sessionSnapshot.data().accessKeyHash
    });
    if (sessionSnapshot.data().status === 'approved') {
      return {
        status: 'approved',
        appointmentId: sessionSnapshot.data().appointmentId
      };
    }

    const paymentId = normalizePaymentId(data?.paymentId);
    if (!paymentId) {
      return {
        status: sessionSnapshot.data().status,
        appointmentId: null,
        checkoutUrl: sessionSnapshot.data().checkoutUrl ?? null
      };
    }
    const payment = await getMercadoPagoPayment({ accessToken, paymentId });
    if (payment.status !== 'approved') {
      await sessionSnapshot.ref.update({
        status: payment.status === 'rejected' ? 'payment_rejected' : 'payment_pending',
        paymentId: String(payment.id)
      });
      return {
        status: payment.status === 'rejected' ? 'rejected' : 'pending',
        appointmentId: null,
        checkoutUrl: sessionSnapshot.data().checkoutUrl ?? null
      };
    }
    return finalizePublicPayment({ firestore, payment, sessionId });
  } catch (error) {
    throw mapError(error);
  }
};
