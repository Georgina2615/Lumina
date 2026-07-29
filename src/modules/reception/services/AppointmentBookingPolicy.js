// Define las reglas operativas de reserva
export const BOOKING_TIMES = Object.freeze([
  Object.freeze({ value: '10:00', label: '10:00 AM - 1:00 PM' }),
  Object.freeze({ value: '14:00', label: '2:00 PM - 5:00 PM' }),
  Object.freeze({ value: '17:00', label: '5:00 PM - 8:00 PM' })
]);
export const SERVICE_DURATION_MINUTES = 150;
export const PREPARATION_MINUTES = 30;
export const BOOKING_BLOCK_MINUTES = 180;
export const DEPOSIT_PERCENTAGE = 30;

const MINIMUM_NOTICE_MINUTES = 15;
const BUSINESS_OFFSET = '-06:00';
const BUSINESS_OFFSET_MINUTES = -360;
const SIMPLE_METHODS = new Set(['efectivo', 'tarjeta', 'transferencia']);
const PAYMENT_METHODS = new Set([...SIMPLE_METHODS, 'mixto']);
const ALLOWED_TIMES = new Set(BOOKING_TIMES.map(({ value }) => value));

// Formatea la fecha civil del negocio
export const getBusinessDateKey = (date = new Date()) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('La fecha no es válida');
  }
  const businessDate = new Date(
    date.getTime() + BUSINESS_OFFSET_MINUTES * 60 * 1000
  );
  return businessDate.toISOString().slice(0, 10);
};

// Valida la fecha civil del negocio
const getDateParts = (dateKey) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? ''))) {
    throw new Error('La fecha no es válida');
  }
  const [year, month, day] = dateKey.split('-').map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (
    calendarDate.getUTCFullYear() !== year
    || calendarDate.getUTCMonth() !== month - 1
    || calendarDate.getUTCDate() !== day
  ) {
    throw new Error('La fecha no es válida');
  }
  return { year, month, day, calendarDate };
};

// Construye el intervalo con la zona fija del negocio
export const buildBookingInterval = ({ dateKey, time }) => {
  const { calendarDate } = getDateParts(dateKey);
  if (!ALLOWED_TIMES.has(time)) {
    throw new Error('El horario no es válido');
  }
  const start = new Date(`${dateKey}T${time}:00${BUSINESS_OFFSET}`);
  if (Number.isNaN(start.getTime())) {
    throw new Error('La fecha no es válida');
  }
  const treatmentEnd = new Date(
    start.getTime() + SERVICE_DURATION_MINUTES * 60 * 1000
  );
  const blockEnd = new Date(
    start.getTime() + BOOKING_BLOCK_MINUTES * 60 * 1000
  );
  return { start, treatmentEnd, blockEnd, calendarDate };
};

// Construye el identificador único del cupo
export const buildAppointmentSlotId = ({ dateKey, time }) => {
  buildBookingInterval({ dateKey, time });
  return `${dateKey}_${time}`;
};

// Valida horario domingo y anticipación
export const validateBookingSchedule = ({
  dateKey,
  time,
  now = new Date()
}) => {
  const interval = buildBookingInterval({ dateKey, time });
  if (interval.calendarDate.getUTCDay() === 0) {
    throw new Error('No se pueden crear citas en domingo');
  }
  const minimumTime = now.getTime() + MINIMUM_NOTICE_MINUTES * 60 * 1000;
  if (interval.start.getTime() < minimumTime) {
    throw new Error('La cita requiere al menos quince minutos de anticipación');
  }
  return interval;
};

// Valida y normaliza el anticipo
export const normalizeDeposit = ({
  deposit,
  priceCents,
  percentage
}) => {
  const method = deposit?.method;
  const payments = deposit?.payments;
  if (!PAYMENT_METHODS.has(method) || !Array.isArray(payments)) {
    throw new Error('El anticipo no tiene una forma de pago válida');
  }
  const expectedLength = method === 'mixto' ? 2 : 1;
  if (payments.length !== expectedLength) {
    throw new Error('El número de pagos del anticipo no es válido');
  }
  const values = payments.map((payment) => {
    if (
      !SIMPLE_METHODS.has(payment?.method)
      || !Number.isSafeInteger(payment?.amountCents)
      || payment.amountCents <= 0
    ) {
      throw new Error('Los pagos del anticipo no son válidos');
    }
    return { metodo: payment.method, montoCentavos: payment.amountCents };
  });
  if (method !== 'mixto' && values[0].metodo !== method) {
    throw new Error('La forma de pago no coincide con el anticipo');
  }
  if (method === 'mixto' && values[0].metodo === values[1].metodo) {
    throw new Error('El pago mixto requiere métodos diferentes');
  }
  if (!Number.isSafeInteger(priceCents * percentage)) {
    throw new Error('El precio del servicio no es válido');
  }
  const amountCents = Math.round(priceCents * percentage / 100);
  const paidCents = values.reduce(
    (total, payment) => total + payment.montoCentavos,
    0
  );
  if (!Number.isSafeInteger(paidCents) || paidCents !== amountCents) {
    throw new Error('Los pagos no suman el anticipo requerido');
  }
  return { method, payments: values, amountCents };
};
