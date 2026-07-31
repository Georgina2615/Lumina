import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  db,
  functionsInstance
} from '../../../config/firebase';

// Prepara la reprogramación protegida en el servidor
const reprogramAppointmentCallable = httpsCallable(
  functionsInstance,
  'reprogramReceptionAppointment'
);

// Limpia mensajes remotos controlados
const normalizeRemoteMessage = (value) => (
  String(value ?? '')
    .replace(/^Firebase:\s*/i, '')
    .replace(/\s*\(functions\/[a-z-]+\)\.?\s*$/i, '')
    .trim()
    .slice(0, 300)
);

// Traduce errores de reprogramación
const getReschedulingErrorMessage = (error) => {
  // Explica una sesión ausente
  if (error?.code === 'functions/unauthenticated') {
    return 'Inicia sesión para reprogramar la cita';
  }

  // Explica permisos insuficientes
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permiso para reprogramar citas';
  }

  // Explica fallos temporales
  if (
    error?.code === 'functions/unavailable'
    || error?.code === 'functions/deadline-exceeded'
  ) {
    return 'No pudimos conectar con la reprogramación de citas';
  }

  // Conserva mensajes controlados del dominio
  if ([
    'functions/already-exists',
    'functions/failed-precondition',
    'functions/invalid-argument',
    'functions/not-found'
  ].includes(error?.code)) {
    return normalizeRemoteMessage(error?.message)
      || 'Revisa los datos de la reprogramación';
  }

  // Oculta detalles inesperados
  return 'No pudimos reprogramar la cita';
};

// Convierte una cita cancelada en crédito utilizable
const mapAvailableCredit = (appointmentSnapshot) => {
  const appointment = appointmentSnapshot.data();
  const creditCents = appointment.reprogramacion
    ?.anticipoDisponibleCentavos;

  // Descarta registros fuera del contrato vigente
  if (
    appointment.estado !== 'cancelada'
    || appointment.schemaVersion !== 3
    || appointment.cancelacion?.origen !== 'clinica'
    || appointment.cancelacion?.reprogramacionDisponible !== true
    || appointment.reprogramacion?.estado !== 'disponible'
    || !Number.isSafeInteger(creditCents)
    || creditCents <= 0
    || typeof appointment.servicioId !== 'string'
    || typeof appointment.servicio !== 'string'
    || typeof appointment.fecha !== 'string'
  ) {
    return null;
  }

  // Devuelve únicamente datos operativos del crédito
  return {
    sourceAppointmentId: appointmentSnapshot.id,
    serviceId: appointment.servicioId,
    serviceName: appointment.servicio,
    dateKey: appointment.fecha,
    time: typeof appointment.hora === 'string' ? appointment.hora : '',
    creditCents
  };
};

// Consulta créditos reales del cliente en una sola lectura
export const getAvailableReschedulingCredits = async (clientId) => {
  // Detiene identidades documentales inválidas
  if (
    typeof clientId !== 'string'
    || !clientId
    || clientId.includes('/')
  ) {
    throw new Error('El cliente no es válido');
  }

  try {
    // Consulta por una sola igualdad sin índice compuesto
    const snapshot = await getDocs(query(
      collection(db, 'citas'),
      where('clienteId', '==', clientId)
    ));

    // Filtra localmente los créditos disponibles
    return snapshot.docs
      .map(mapAvailableCredit)
      .filter(Boolean)
      .sort((first, second) => (
        second.dateKey.localeCompare(first.dateKey)
      ));
  } catch (error) {
    console.error('Error al consultar créditos de citas', error);
    throw new Error(
      'No pudimos consultar los créditos disponibles',
      { cause: error }
    );
  }
};

// Valida la respuesta mínima de reprogramación
const mapReschedulingResult = (data) => {
  const requiredStrings = [
    'appointmentId',
    'clientId',
    'slotId'
  ];
  const requiredAmounts = [
    'depositAmountCents',
    'creditAppliedCents',
    'additionalDepositCents'
  ];

  // Detiene respuestas incompletas
  if (
    requiredStrings.some((key) => typeof data?.[key] !== 'string')
    || requiredAmounts.some(
      (key) => !Number.isSafeInteger(data?.[key]) || data[key] < 0
    )
    || !Array.isArray(data?.depositPaymentIds)
    || data.depositPaymentIds.length < 1
    || data.depositPaymentIds.length > 5
    || new Set(data.depositPaymentIds).size
      !== data.depositPaymentIds.length
    || data.depositPaymentIds.some(
      (paymentId) => typeof paymentId !== 'string' || !paymentId
    )
    || typeof data?.alreadyProcessed !== 'boolean'
  ) {
    throw new Error('La función devolvió una reprogramación incompleta');
  }

  // Devuelve el resultado verificado
  return {
    appointmentId: data.appointmentId,
    clientId: data.clientId,
    slotId: data.slotId,
    depositAmountCents: data.depositAmountCents,
    creditAppliedCents: data.creditAppliedCents,
    additionalDepositCents: data.additionalDepositCents,
    depositPaymentIds: data.depositPaymentIds,
    alreadyProcessed: data.alreadyProcessed,
    isRescheduled: true
  };
};

// Solicita una reprogramación atómica
export const reprogramAppointmentBooking = async (request) => {
  try {
    // Envía solo la intención autorizada
    const response = await reprogramAppointmentCallable(request);

    // Devuelve la reprogramación confirmada
    return mapReschedulingResult(response.data);
  } catch (error) {
    throw new Error(
      getReschedulingErrorMessage(error),
      { cause: error }
    );
  }
};
