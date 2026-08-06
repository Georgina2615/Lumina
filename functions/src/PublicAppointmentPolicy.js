import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { normalizeAppointmentClient } from './AppointmentClientPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import {
  APPOINTMENT_TIMES,
  buildAppointmentInterval
} from './AppointmentSchedulePolicy.js';

// Define la anticipacion de las solicitudes publicas
export const PUBLIC_NOTICE_MINUTES = 120;

// Define el limite de la imagen procesada
export const PUBLIC_PROOF_MAX_BYTES = 750 * 1024;

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

// Lanza un error publico conocido
const fail = (message) => {
  throw new AppointmentError('invalid-argument', message);
};

// Normaliza el servicio seleccionado
const normalizeServiceId = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > 500 || normalized.includes('/')) {
    fail('Selecciona un servicio válido');
  }
  return normalized;
};

// Normaliza el folio visible de transferencia
const normalizePaymentReference = (value) => {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^LS-WEB-[A-F0-9]{8}$/.test(normalized)) {
    fail('El folio de transferencia no es válido');
  }
  return normalized;
};

// Exige un correo para la reserva digital
const requirePublicEmail = (client) => {
  if (!client.email) {
    fail('El correo electrónico es obligatorio para agendar en línea');
  }
  return client;
};

// Convierte el comprobante procesado
const normalizeProof = (value) => {
  const match = typeof value === 'string'
    ? value.match(/^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/)
    : null;
  if (!match) fail('Adjunta una imagen válida del comprobante');

  const buffer = Buffer.from(match[1], 'base64');
  const isWebP = buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';

  if (!isWebP || buffer.length < 100 || buffer.length > PUBLIC_PROOF_MAX_BYTES) {
    fail('El comprobante no tiene un formato o tamaño válido');
  }
  return buffer;
};

// Construye una identidad privada para solicitudes activas
export const buildPublicContactKey = (client) => createHash('sha256')
  .update(`${client.email}|${client.phone}`)
  .digest('hex');

// Valida una fecha para consultar disponibilidad
export const validatePublicAvailabilityRequest = (data, now = new Date()) => {
  if (!isRecord(data) || Object.keys(data).some((key) => key !== 'dateKey')) {
    fail('La consulta de disponibilidad no es válida');
  }

  const intervals = APPOINTMENT_TIMES.map((time) => buildAppointmentInterval({
    dateKey: data.dateKey,
    time,
    now,
    enforceMinimumNotice: false
  }));

  return { dateKey: intervals[0].dateKey };
};

// Valida la solicitud publica completa
export const validatePublicAppointmentRequest = (data, now = new Date()) => {
  const allowedKeys = [
    'client', 'serviceId', 'dateKey', 'time', 'proofDataUrl',
    'paymentReference', 'privacyAccepted', 'termsAccepted',
    'cancellationAccepted'
  ];
  if (
    !isRecord(data)
    || Object.keys(data).some((key) => !allowedKeys.includes(key))
  ) {
    fail('La solicitud contiene información no permitida');
  }
  if (
    data.privacyAccepted !== true
    || data.termsAccepted !== true
    || data.cancellationAccepted !== true
  ) {
    fail('Acepta los documentos informativos para continuar');
  }

  const client = requirePublicEmail(normalizeAppointmentClient(data.client));
  const interval = buildAppointmentInterval({
    dateKey: data.dateKey,
    time: data.time,
    now,
    enforceMinimumNotice: false
  });
  const minimumStart = now.getTime() + PUBLIC_NOTICE_MINUTES * 60 * 1000;
  if (interval.start.getTime() < minimumStart) {
    fail('Las citas en línea requieren al menos dos horas de anticipación');
  }

  return {
    client,
    contactKey: buildPublicContactKey(client),
    serviceId: normalizeServiceId(data.serviceId),
    paymentReference: normalizePaymentReference(data.paymentReference),
    interval,
    proof: normalizeProof(data.proofDataUrl)
  };
};
