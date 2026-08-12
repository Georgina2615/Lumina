import { createHash, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  buildClientIdentities,
  normalizeAppointmentClient
} from './AppointmentClientPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import {
  buildAppointmentInterval,
  buildAppointmentSlotId
} from './AppointmentSchedulePolicy.js';

export const PUBLIC_PAYMENT_MINUTES = 15;
export const PUBLIC_RESERVATION_MINUTES = 20;

// Lanza un error conocido del agendamiento
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Reconoce objetos simples
const isRecord = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

// Normaliza un identificador documental
const normalizeId = (value, message) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > 500 || normalized.includes('/')) {
    fail('invalid-argument', message);
  }
  return normalized;
};

// Exige el correo del agendamiento digital
const requirePublicClient = (value) => {
  const client = normalizeAppointmentClient(value);
  if (!client.email) {
    fail('invalid-argument', 'El correo electrónico es obligatorio para agendar en línea');
  }
  return client;
};

// Valida los datos previos al cobro
export const validatePublicPaymentRequest = (data, now = new Date()) => {
  const allowed = [
    'client', 'serviceId', 'dateKey', 'time', 'privacyAccepted',
    'termsAccepted', 'cancellationAccepted', 'returnOrigin'
  ];
  if (!isRecord(data) || Object.keys(data).some((key) => !allowed.includes(key))) {
    fail('invalid-argument', 'La solicitud contiene información no permitida');
  }
  if (
    data.privacyAccepted !== true
    || data.termsAccepted !== true
    || data.cancellationAccepted !== true
  ) {
    fail('invalid-argument', 'Acepta los documentos informativos para continuar');
  }

  const returnOrigin = String(data.returnOrigin ?? '').trim().replace(/\/$/, '');
  // Determina orígenes permitidos desde variable de entorno (coma-separados)
  const envAllowed = String(process.env.ALLOWED_RETURN_ORIGINS ?? '').split(',')
    .map((s) => String(s ?? '').trim())
    .filter(Boolean);

  const defaultAllowed = [
    'https://lumina-f247c.web.app',
    'https://lumina-f247c.firebaseapp.com',
    'http://localhost:5173'
  ];

  const allowed = envAllowed.length > 0 ? envAllowed : defaultAllowed;

  if (!allowed.includes(returnOrigin)) {
    fail('invalid-argument', 'El regreso al sitio no es válido');
  }

  const interval = buildAppointmentInterval({
    dateKey: data.dateKey,
    time: data.time,
    now,
    enforceMinimumNotice: false
  });
  if (interval.start.getTime() < now.getTime() + 120 * 60 * 1000) {
    fail('invalid-argument', 'Las citas en línea requieren al menos dos horas de anticipación');
  }

  const client = requirePublicClient(data.client);
  return {
    client,
    contactKey: createHash('sha256')
      .update(`${client.email}|${client.phone}`)
      .digest('hex'),
    identities: buildClientIdentities(client),
    interval,
    returnOrigin,
    serviceId: normalizeId(data.serviceId, 'Selecciona un servicio válido'),
    slotId: buildAppointmentSlotId(interval)
  };
};

// Protege el acceso publico a una sesión de pago
export const hashPublicPaymentAccessKey = (value) => createHash('sha256')
  .update(String(value))
  .digest('hex');

// Compara la llave privada de una sesión
export const requirePublicPaymentAccess = ({ accessKey, storedHash }) => {
  const actual = Buffer.from(hashPublicPaymentAccessKey(accessKey), 'hex');
  const expected = Buffer.from(String(storedHash ?? ''), 'hex');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    fail('permission-denied', 'La consulta del pago no es válida');
  }
};

// Convierte un pago aprobado al contrato financiero interno
export const buildMercadoPagoDeposit = ({ payment, requiredCents }) => {
  const amountCents = Math.round(Number(payment?.transaction_amount) * 100);
  if (
    payment?.status !== 'approved'
    || payment?.currency_id !== 'MXN'
    || !Number.isSafeInteger(amountCents)
    || amountCents !== requiredCents
  ) {
    fail('failed-precondition', 'El pago todavía no está aprobado');
  }

  const cardPayment = ['credit_card', 'debit_card', 'prepaid_card'].includes(
    payment.payment_type_id
  );
  const method = cardPayment ? 'tarjeta' : 'transferencia';
  return {
    amountCents,
    method,
    paymentId: String(payment.id),
    payments: [{
      method,
      amountCents,
      cashReceivedCents: 0,
      changeCents: 0,
      reference: String(payment.id),
      cardLastFour: cardPayment
        ? String(payment.card?.last_four_digits ?? '')
        : ''
    }]
  };
};
