const BUSINESS_TIME_ZONE = 'America/Mexico_City';

const businessDateFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  month: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric'
});

const businessDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  second: '2-digit',
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric'
});

// Convierte las partes de formato en valores numéricos
const getNumericParts = (formatter, date) => (
  Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)])
  )
);

// Obtiene el desplazamiento real de la zona operativa
const getTimeZoneOffset = (date) => {
  const parts = getNumericParts(businessDateTimeFormatter, date);
  const zonedTime = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  const comparableTime = Math.floor(date.getTime() / 1000) * 1000;

  return zonedTime - comparableTime;
};

// Construye una medianoche dentro de la zona operativa
const createBusinessMidnight = ({ year, month, day }) => {
  const targetTime = Date.UTC(year, month - 1, day);
  const firstCandidate = new Date(targetTime);
  const firstOffset = getTimeZoneOffset(firstCandidate);
  const adjustedCandidate = new Date(targetTime - firstOffset);
  const finalOffset = getTimeZoneOffset(adjustedCandidate);

  return new Date(targetTime - finalOffset);
};

// Desplaza una fecha civil sin depender de la zona del dispositivo
const shiftCivilDate = ({ year, month, day }, days, months = 0) => {
  const shiftedDate = new Date(Date.UTC(
    year,
    month - 1 + months,
    day + days
  ));

  return {
    day: shiftedDate.getUTCDate(),
    month: shiftedDate.getUTCMonth() + 1,
    year: shiftedDate.getUTCFullYear()
  };
};

// Formatea la clave civil utilizada por las citas
const formatDateKey = ({ year, month, day }) => (
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
);

// Construye los límites temporales del panel administrativo
export const getAdminDashboardPeriod = (now = new Date()) => {
  const today = getNumericParts(businessDateFormatter, now);
  const tomorrow = shiftCivilDate(today, 1);
  const monthStart = { ...today, day: 1 };
  const nextMonthStart = shiftCivilDate(monthStart, 0, 1);

  return {
    dateKey: formatDateKey(today),
    monthStart: createBusinessMidnight(monthStart),
    nextMonthStart: createBusinessMidnight(nextMonthStart),
    todayStart: createBusinessMidnight(today),
    tomorrowStart: createBusinessMidnight(tomorrow)
  };
};

// Expone la zona usada por los formatos visuales
export const adminBusinessTimeZone = BUSINESS_TIME_ZONE;
