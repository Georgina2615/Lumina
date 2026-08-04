import {
  BOOKING_TIMES,
  getBusinessDateKey,
  validateBookingSchedule
} from '../../../../../shared/services/AppointmentSchedulePolicy';

export { BOOKING_TIMES, getBusinessDateKey };

// Construye una identidad segura para cada orden
export const createAvailabilityOperationId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `availability_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

// Resuelve el estado visible de cada horario
export const resolveAvailabilitySlot = ({
  dateKey,
  slot,
  time,
  now = new Date()
}) => {
  if (slot?.kind === 'blocked') {
    return { ...slot, state: 'blocked' };
  }

  if (slot) {
    return { ...slot, state: 'appointment' };
  }

  try {
    validateBookingSchedule({ dateKey, time, now });
    return { dateKey, time, state: 'available' };
  } catch {
    return { dateKey, time, state: 'unavailable' };
  }
};

// Presenta una fecha civil sin moverla de dia
export const formatAvailabilityDate = (dateKey) => {
  const date = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

// Indica si aun existe un horario libre
export const hasAvailableSlots = (slots) => (
  slots.some(({ state }) => state === 'available')
);
