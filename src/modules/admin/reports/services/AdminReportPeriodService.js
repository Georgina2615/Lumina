import {
  getAdminDashboardPeriod
} from '../../dashboard/services/AdminDashboardPeriodService.js';

const DAYS_BEFORE_TODAY = 6;

// Define las claves estables del selector
export const REPORT_PERIOD_KEYS = Object.freeze({
  currentMonth: 'currentMonth',
  lastSevenDays: 'lastSevenDays',
  today: 'today'
});

// Reconoce las opciones permitidas
const validPeriodKeys = new Set(Object.values(REPORT_PERIOD_KEYS));

// Construye un instante seguro dentro de una fecha civil
const createCivilDateAnchor = (dateKey, daysToShift) => {
  const [year, month, day] = dateKey.split('-').map(Number);

  return new Date(Date.UTC(
    year,
    month - 1,
    day + daysToShift,
    18
  ));
};

// Construye el rango inclusivo de siete fechas civiles
const getLastSevenDaysStart = (dashboardPeriod) => {
  const anchor = createCivilDateAnchor(
    dashboardPeriod.dateKey,
    -DAYS_BEFORE_TODAY
  );

  return getAdminDashboardPeriod(anchor).todayStart;
};

// Resuelve un rango financiero en la zona operativa
export const getAdminReportPeriod = (
  periodKey = REPORT_PERIOD_KEYS.today,
  now = new Date()
) => {
  if (!validPeriodKeys.has(periodKey)) {
    throw new Error('El periodo del reporte no es válido');
  }

  const dashboardPeriod = getAdminDashboardPeriod(now);
  const ranges = {
    [REPORT_PERIOD_KEYS.today]: {
      end: dashboardPeriod.tomorrowStart,
      start: dashboardPeriod.todayStart
    },
    [REPORT_PERIOD_KEYS.lastSevenDays]: {
      end: dashboardPeriod.tomorrowStart,
      start: getLastSevenDaysStart(dashboardPeriod)
    },
    [REPORT_PERIOD_KEYS.currentMonth]: {
      end: dashboardPeriod.nextMonthStart,
      start: dashboardPeriod.monthStart
    }
  };

  return {
    dateKey: dashboardPeriod.dateKey,
    key: periodKey,
    ...ranges[periodKey]
  };
};
