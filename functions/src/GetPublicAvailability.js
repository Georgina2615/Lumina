import { HttpsError } from 'firebase-functions/v2/https';
import { AppointmentError } from './AppointmentError.js';
import {
  APPOINTMENT_TIMES,
  buildAppointmentInterval
} from './AppointmentSchedulePolicy.js';
import {
  PUBLIC_NOTICE_MINUTES,
  validatePublicAvailabilityRequest
} from './PublicAppointmentPolicy.js';

// Convierte errores de disponibilidad
const mapError = (error) => error instanceof AppointmentError
  ? new HttpsError(error.code, error.message)
  : new HttpsError('internal', 'No se pudo consultar la disponibilidad');

// Determina si una reserva publica conserva el horario
export const isActivePublicReservation = (reservation, now) => {
  if (reservation.status === 'pending_review') return true;
  const expiresAt = typeof reservation.expiresAt?.toDate === 'function'
    ? reservation.expiresAt.toDate()
    : reservation.expiresAt;
  return reservation.status === 'pending_payment'
    && expiresAt instanceof Date
    && !Number.isNaN(expiresAt.getTime())
    && expiresAt.getTime() > now.getTime();
};

// Consulta horarios sin exponer datos privados
export const getPublicAvailabilityHandler = async ({
  data,
  firestore,
  now = new Date()
}) => {
  try {
    const request = validatePublicAvailabilityRequest(data, now);
    const [slots, reservations] = await Promise.all([
      firestore.collection('cupos').where('fecha', '==', request.dateKey).get(),
      firestore.collection('reservasPublicas')
        .where('dateKey', '==', request.dateKey)
        .get()
    ]);
    const occupied = new Set(slots.docs.map((snapshot) => snapshot.data().hora));
    reservations.docs.forEach((snapshot) => {
      const reservation = snapshot.data();
      if (isActivePublicReservation(reservation, now)) {
        occupied.add(snapshot.data().time);
      }
    });

    const minimumStart = now.getTime() + PUBLIC_NOTICE_MINUTES * 60 * 1000;
    const times = APPOINTMENT_TIMES.map((time) => {
      const interval = buildAppointmentInterval({
        dateKey: request.dateKey,
        time,
        now,
        enforceMinimumNotice: false
      });
      return {
        time,
        available: !occupied.has(time) && interval.start.getTime() >= minimumStart
      };
    });
    return { dateKey: request.dateKey, times };
  } catch (error) {
    throw mapError(error);
  }
};
