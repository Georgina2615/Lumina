// Define las reglas operativas de reserva
export const BOOKING_TIMES = Object.freeze([
  Object.freeze({ value: '10:00', label: '10:00 AM - 1:00 PM' }),
  Object.freeze({ value: '14:00', label: '2:00 PM - 5:00 PM' }),
  Object.freeze({ value: '17:00', label: '5:00 PM - 8:00 PM' })
]);

// Define la duración clínica
export const SERVICE_DURATION_MINUTES = 150;

// Define el tiempo de preparación
export const PREPARATION_MINUTES = 30;

// Define la ocupación total del cupo
export const BOOKING_BLOCK_MINUTES = 180;

// Define la anticipación mínima
const MINIMUM_NOTICE_MINUTES = 15;

// Define la zona fija de la sucursal
const BUSINESS_OFFSET = '-06:00';

// Define el desplazamiento en minutos
const BUSINESS_OFFSET_MINUTES = -360;

// Indexa los horarios permitidos
const ALLOWED_TIMES = new Set(BOOKING_TIMES.map(({ value }) => value));

// Formatea la fecha civil del negocio
export const getBusinessDateKey = (date = new Date()) => {
  // Detiene fechas inválidas
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('La fecha no es válida');
  }

  // Desplaza la fecha a la zona de negocio
  const businessDate = new Date(
    date.getTime() + BUSINESS_OFFSET_MINUTES * 60 * 1000
  );

  // Devuelve la clave civil
  return businessDate.toISOString().slice(0, 10);
};

// Valida la fecha civil del negocio
const getDateParts = (dateKey) => {
  // Detiene claves con formato inválido
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? ''))) {
    throw new Error('La fecha no es válida');
  }

  // Separa los componentes civiles
  const [year, month, day] = dateKey.split('-').map(Number);

  // Construye una fecha comparable
  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  // Detiene fechas inexistentes
  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
  ) {
    throw new Error('La fecha no es válida');
  }

  // Devuelve los componentes verificados
  return { year, month, day, calendarDate };
};

// Construye el intervalo con la zona fija del negocio
export const buildBookingInterval = ({ dateKey, time }) => {
  // Obtiene la fecha civil validada
  const { calendarDate } = getDateParts(dateKey);

  // Detiene horarios fuera del catálogo
  if (!ALLOWED_TIMES.has(time)) {
    throw new Error('El horario no es válido');
  }

  // Construye el inicio absoluto
  const start = new Date(`${dateKey}T${time}:00${BUSINESS_OFFSET}`);

  // Detiene conversiones inválidas
  if (Number.isNaN(start.getTime())) {
    throw new Error('La fecha no es válida');
  }

  // Calcula el final del procedimiento
  const treatmentEnd = new Date(
    start.getTime() + SERVICE_DURATION_MINUTES * 60 * 1000
  );

  // Calcula la liberación de cabina
  const blockEnd = new Date(
    start.getTime() + BOOKING_BLOCK_MINUTES * 60 * 1000
  );

  // Devuelve el intervalo canónico
  return { start, treatmentEnd, blockEnd, calendarDate };
};

// Construye el identificador único del cupo
export const buildAppointmentSlotId = ({ dateKey, time }) => {
  buildBookingInterval({ dateKey, time });

  // Devuelve la identidad determinista
  return `${dateKey}_${time}`;
};

// Valida horario domingo y anticipación
export const validateBookingSchedule = ({
  dateKey,
  time,
  now = new Date()
}) => {
  // Construye el intervalo solicitado
  const interval = buildBookingInterval({ dateKey, time });

  // Detiene reservas dominicales
  if (interval.calendarDate.getUTCDay() === 0) {
    throw new Error('No se pueden crear citas en domingo');
  }

  // Calcula el momento mínimo permitido
  const minimumTime = now.getTime() + MINIMUM_NOTICE_MINUTES * 60 * 1000;

  // Detiene reservas sin anticipación
  if (interval.start.getTime() < minimumTime) {
    throw new Error('La cita requiere al menos quince minutos de anticipación');
  }

  // Devuelve el intervalo autorizado
  return interval;
};

// Construye las opciones visibles de horario
export const buildBookingTimeOptions = ({
  dateKey,
  slots,
  now = new Date()
}) => (
  BOOKING_TIMES.map((bookingTime) => {
    const occupied = slots.some(
      ({ time }) => time === bookingTime.value
    );
    let scheduleUnavailable = false;

    try {
      validateBookingSchedule({
        dateKey,
        time: bookingTime.value,
        now
      });
    } catch {
      scheduleUnavailable = Boolean(dateKey);
    }

    return {
      ...bookingTime,
      disabled: occupied || scheduleUnavailable,
      status: occupied
        ? 'Ocupado'
        : scheduleUnavailable
          ? 'No disponible'
          : ''
    };
  })
);
