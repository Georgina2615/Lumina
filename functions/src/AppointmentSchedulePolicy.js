import { AppointmentError } from './AppointmentError.js';

// Define los horarios operativos disponibles
const ALLOWED_TIMES = new Set(['10:00', '14:00', '17:00']);

// Define la duración clínica vigente
export const SERVICE_DURATION_MINUTES = 150;

// Define el tiempo adicional de cabina
export const PREPARATION_MINUTES = 30;

// Define la ocupación total de la cabina
export const BOOKING_BLOCK_MINUTES = 180;

// Define el anticipo obligatorio
export const DEPOSIT_PERCENTAGE = 30;

// Define la anticipación mínima
const MINIMUM_NOTICE_MINUTES = 15;

// Define la zona fija de la sucursal
const BUSINESS_OFFSET = '-06:00';

// Lanza un error conocido del dominio
const fail = (message) => {
  throw new AppointmentError('invalid-argument', message);
};

// Valida una fecha civil real
const parseDateKey = (dateKey) => {
  // Normaliza la fecha recibida
  const normalized = typeof dateKey === 'string' ? dateKey.trim() : '';

  // Detiene formatos desconocidos
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    fail('La fecha de la cita no es válida');
  }

  // Separa los componentes civiles
  const [year, month, day] = normalized.split('-').map(Number);

  // Construye una fecha comparable
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  // Detiene fechas inexistentes
  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
  ) {
    fail('La fecha de la cita no es válida');
  }

  // Devuelve la fecha normalizada
  return { dateKey: normalized, calendarDate };
};

// Construye el intervalo absoluto de la cita
export const buildAppointmentInterval = ({
  dateKey,
  time,
  now = new Date()
}) => {
  // Valida el reloj usado por el servidor
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    fail('No se pudo validar la hora de la cita');
  }

  // Obtiene la fecha civil comprobada
  const parsedDate = parseDateKey(dateKey);

  // Detiene horarios fuera del catálogo
  if (!ALLOWED_TIMES.has(time)) {
    fail('El horario de la cita no es válido');
  }

  // Detiene reservas dominicales
  if (parsedDate.calendarDate.getUTCDay() === 0) {
    fail('No se pueden crear citas en domingo');
  }

  // Construye el inicio en la zona de la sucursal
  const start = new Date(
    `${parsedDate.dateKey}T${time}:00${BUSINESS_OFFSET}`
  );

  // Detiene conversiones inesperadas
  if (Number.isNaN(start.getTime())) {
    fail('La fecha de la cita no es válida');
  }

  // Calcula la anticipación mínima permitida
  const minimumStart = (
    now.getTime() + MINIMUM_NOTICE_MINUTES * 60 * 1000
  );

  // Detiene reservas demasiado próximas
  if (start.getTime() < minimumStart) {
    fail('La cita requiere al menos quince minutos de anticipación');
  }

  // Calcula el final del tratamiento
  const treatmentEnd = new Date(
    start.getTime() + SERVICE_DURATION_MINUTES * 60 * 1000
  );

  // Calcula la liberación de la cabina
  const blockEnd = new Date(
    start.getTime() + BOOKING_BLOCK_MINUTES * 60 * 1000
  );

  // Devuelve el intervalo canónico
  return {
    dateKey: parsedDate.dateKey,
    time,
    start,
    treatmentEnd,
    blockEnd
  };
};

// Construye el identificador exclusivo del horario
export const buildAppointmentSlotId = ({ dateKey, time }) => (
  `${dateKey}_${time}`
);
