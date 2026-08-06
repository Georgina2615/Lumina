import {
  buildClientIdentities,
  normalizeAppointmentClient
} from './AppointmentClientPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import {
  buildAppointmentInterval,
  buildAppointmentSlotId
} from './AppointmentSchedulePolicy.js';

// Define las acciones permitidas
const REVIEW_ACTIONS = new Set(['approve', 'reject']);

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Reconoce objetos simples
const isRecord = (value) => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);

// Normaliza un identificador documental
const normalizeDocumentId = (value) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > 500 || normalized.includes('/')) {
    fail('invalid-argument', 'La solicitud seleccionada no es válida');
  }
  return normalized;
};

// Valida la intención de revisión
export const validatePublicRequestReview = (data) => {
  if (!isRecord(data)) {
    fail('invalid-argument', 'La revisión no es válida');
  }

  const allowedKeys = ['requestId', 'action', 'reason'];
  if (Object.keys(data).some((key) => !allowedKeys.includes(key))) {
    fail('invalid-argument', 'La revisión contiene campos no permitidos');
  }

  const action = data.action;
  if (!REVIEW_ACTIONS.has(action)) {
    fail('invalid-argument', 'Selecciona una acción válida');
  }

  const reason = typeof data.reason === 'string'
    ? data.reason.trim().replace(/\s+/g, ' ')
    : '';
  if (action === 'reject' && (reason.length < 3 || reason.length > 300)) {
    fail('invalid-argument', 'Escribe el motivo del rechazo');
  }
  if (action === 'approve' && reason) {
    fail('invalid-argument', 'La aprobación no requiere un motivo');
  }

  return {
    requestId: normalizeDocumentId(data.requestId),
    action,
    reason
  };
};

// Convierte una marca temporal persistida
const requireDate = (value, message) => {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    fail('failed-precondition', message);
  }
  return date;
};

// Valida una solicitud pendiente persistida
export const requirePendingPublicRequest = ({
  snapshot,
  now,
  requestId,
  enforceMinimumNotice
}) => {
  if (!snapshot.exists) {
    fail('not-found', 'La solicitud ya no existe');
  }

  const data = snapshot.data();
  if (data.requestId !== requestId) {
    fail('failed-precondition', 'La solicitud requiere revisión');
  }
  if (data.status !== 'pending_review') {
    if (!['approved', 'rejected'].includes(data.status)) {
      fail('failed-precondition', 'La solicitud tiene un estado desconocido');
    }
    return {
      alreadyProcessed: true,
      status: data.status,
      appointmentId: data.appointmentId ?? null,
      clientId: data.clientId ?? null
    };
  }

  const client = normalizeAppointmentClient({
    id: null,
    ...data.client
  });
  if (!client.email) {
    fail('failed-precondition', 'La solicitud no tiene un correo válido');
  }

  const interval = buildAppointmentInterval({
    dateKey: data.schedule?.dateKey,
    time: data.schedule?.time,
    now,
    enforceMinimumNotice
  });
  const storedStart = requireDate(
    data.schedule?.start,
    'La solicitud no tiene un horario válido'
  );
  const storedEnd = requireDate(
    data.schedule?.blockEnd,
    'La solicitud no tiene un horario válido'
  );
  if (
    storedStart.getTime() !== interval.start.getTime()
    || storedEnd.getTime() !== interval.blockEnd.getTime()
  ) {
    fail('failed-precondition', 'El horario de la solicitud requiere revisión');
  }

  const serviceId = normalizeDocumentId(data.service?.id);
  if (!/^[a-f0-9]{64}$/.test(String(data.contactKey ?? ''))) {
    fail('failed-precondition', 'El contacto de la solicitud requiere revisión');
  }
  const reference = typeof data.proof?.paymentReference === 'string'
    ? data.proof.paymentReference.trim()
    : '';
  const proofPath = typeof data.proof?.path === 'string'
    ? data.proof.path.trim()
    : '';
  if (!/^LS-WEB-[A-F0-9]{8}$/.test(reference) || !proofPath) {
    fail('failed-precondition', 'El comprobante requiere revisión');
  }

  return {
    alreadyProcessed: false,
    client,
    contactKey: data.contactKey,
    identities: buildClientIdentities(client),
    interval,
    paymentReference: reference,
    proofPath,
    serviceSnapshot: data.service,
    serviceId,
    slotId: buildAppointmentSlotId(interval)
  };
};

// Verifica la reserva temporal correspondiente
export const requireMatchingPublicReservation = ({ snapshot, requestId, slotId }) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (
    !data
    || data.status !== 'pending_review'
    || data.requestId !== requestId
    || snapshot.id !== slotId
  ) {
    fail('failed-precondition', 'El horario reservado requiere revisión');
  }
};

// Verifica que el servicio no haya cambiado
export const requireMatchingPublicService = ({ service, stored }) => {
  if (
    stored?.name !== service.name
    || stored?.priceCents !== service.priceCents
    || stored?.depositPercentage !== service.depositPercentage
    || stored?.depositAmountCents
      !== Math.round(service.priceCents * service.depositPercentage / 100)
  ) {
    fail('failed-precondition', 'El servicio cambió desde la solicitud');
  }
};

// Conserva el contacto oficial de un cliente existente
export const requirePublicStoredClient = ({ snapshot, requestedClient }) => {
  if (!snapshot.exists || snapshot.data().fusionado === true) {
    fail('failed-precondition', 'El cliente ya no está disponible');
  }

  const data = snapshot.data();
  const storedClient = normalizeAppointmentClient({
    id: snapshot.id,
    fullName: data.nombreCompleto,
    phone: data.telefonoNormalizado || data.telefono,
    email: Object.hasOwn(data, 'emailNormalizado')
      ? data.emailNormalizado
      : data.email
  });
  if (
    storedClient.phone !== requestedClient.phone
    || storedClient.email !== requestedClient.email
  ) {
    fail('failed-precondition', 'Actualiza el contacto desde el perfil del cliente');
  }
  return storedClient;
};
