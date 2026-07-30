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
// Define el anticipo requerido
export const DEPOSIT_PERCENTAGE = 30;

// Define la anticipación mínima
const MINIMUM_NOTICE_MINUTES = 15;
// Define la zona fija de la sucursal
const BUSINESS_OFFSET = '-06:00';
// Define el desplazamiento en minutos
const BUSINESS_OFFSET_MINUTES = -360;
// Define los métodos individuales
const SIMPLE_METHODS = new Set(['efectivo', 'tarjeta', 'transferencia']);
// Define todos los métodos aceptados
const PAYMENT_METHODS = new Set([...SIMPLE_METHODS, 'mixto']);
// Indexa los horarios permitidos
const ALLOWED_TIMES = new Set(BOOKING_TIMES.map(({ value }) => value));

// Valida una parte monetaria del anticipo
const normalizeDepositEntry = (payment) => {
  // Obtiene los campos normalizados
  const method = payment?.method;
  const amountCents = payment?.amountCents;
  const cashReceivedCents = payment?.cashReceivedCents;
  const changeCents = payment?.changeCents;
  const reference = String(payment?.reference ?? '').trim();
  const cardLastFour = String(payment?.cardLastFour ?? '');

  // Detiene métodos e importes inválidos
  if (
    !SIMPLE_METHODS.has(method)
    || !Number.isSafeInteger(amountCents)
    || amountCents <= 0
    || !Number.isSafeInteger(cashReceivedCents)
    || cashReceivedCents < 0
    || !Number.isSafeInteger(changeCents)
    || changeCents < 0
  ) {
    throw new Error('Los pagos del anticipo no son válidos');
  }

  // Detiene efectivo inconsistente
  if (
    method === 'efectivo'
    && (
      cashReceivedCents < amountCents
      || changeCents !== cashReceivedCents - amountCents
    )
  ) {
    throw new Error('El efectivo del anticipo no es válido');
  }

  // Detiene campos monetarios fuera de efectivo
  if (
    method !== 'efectivo'
    && (cashReceivedCents !== 0 || changeCents !== 0)
  ) {
    throw new Error('El desglose del anticipo no es válido');
  }

  // Detiene transferencias sin referencia
  if (
    (method === 'transferencia' && reference.length < 3)
    || reference.length > 120
  ) {
    throw new Error('La referencia del anticipo no es válida');
  }

  // Detiene terminaciones de tarjeta inválidas
  if (
    cardLastFour
    && (method !== 'tarjeta' || !/^\d{4}$/.test(cardLastFour))
  ) {
    throw new Error('La tarjeta del anticipo no es válida');
  }

  // Devuelve el pago persistente
  return {
    metodo: method,
    montoCentavos: amountCents,
    efectivoRecibidoCentavos: cashReceivedCents,
    cambioCentavos: changeCents,
    referencia: method === 'efectivo' ? '' : reference,
    ultimosCuatro: method === 'tarjeta' ? cardLastFour : ''
  };
};

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

// Valida y normaliza el anticipo
export const normalizeDeposit = ({
  deposit,
  priceCents,
  percentage
}) => {
  // Obtiene el contrato recibido
  const method = deposit?.method;
  const payments = deposit?.payments;

  // Detiene contratos incompletos
  if (!PAYMENT_METHODS.has(method) || !Array.isArray(payments)) {
    throw new Error('El anticipo no tiene una forma de pago válida');
  }

  // Calcula la cantidad esperada de partes
  const expectedLength = method === 'mixto' ? 2 : 1;

  // Detiene cantidades de partes inválidas
  if (payments.length !== expectedLength) {
    throw new Error('El número de pagos del anticipo no es válido');
  }

  // Normaliza todas las partes
  const values = payments.map(normalizeDepositEntry);

  // Detiene métodos simples inconsistentes
  if (method !== 'mixto' && values[0].metodo !== method) {
    throw new Error('La forma de pago no coincide con el anticipo');
  }

  // Detiene métodos mixtos repetidos
  if (method === 'mixto' && values[0].metodo === values[1].metodo) {
    throw new Error('El pago mixto requiere métodos diferentes');
  }

  // Detiene multiplicaciones fuera de rango
  if (!Number.isSafeInteger(priceCents * percentage)) {
    throw new Error('El precio del servicio no es válido');
  }

  // Calcula el anticipo requerido
  const amountCents = Math.round(priceCents * percentage / 100);

  // Suma las partes registradas
  const paidCents = values.reduce(
    (total, payment) => total + payment.montoCentavos,
    0
  );

  // Detiene importes que no coinciden
  if (!Number.isSafeInteger(paidCents) || paidCents !== amountCents) {
    throw new Error('Los pagos no suman el anticipo requerido');
  }

  // Devuelve el anticipo canónico
  return { method, payments: values, amountCents };
};
