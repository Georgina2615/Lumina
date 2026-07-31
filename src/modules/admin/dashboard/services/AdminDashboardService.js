import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import {
  mapDashboardPayment,
  mapDashboardProduct,
  mapDashboardSale
} from './AdminDashboardMapperService';
import { getAdminDashboardPeriod } from './AdminDashboardPeriodService';

const appointmentStates = [
  'por_confirmar',
  'confirmada',
  'en_cabina',
  'por_cobrar',
  'finalizada',
  'cancelada',
  'no_asistio'
];

const terminalAppointmentStates = new Set(['cancelada', 'no_asistio']);

// Traduce fallos técnicos a mensajes operativos
const getDashboardErrorMessage = (error) => {
  if (error?.code === 'permission-denied') {
    return 'No tienes permisos para consultar esta información';
  }

  if (error?.code === 'unavailable') {
    return 'No hay conexión para actualizar esta información';
  }

  if (error?.code === 'failed-precondition') {
    return 'La consulta requiere una configuración adicional';
  }

  return 'No se pudo cargar esta sección';
};

// Ejecuta una lectura sin ocultar fallos de otras secciones
const loadSection = async (loader) => {
  try {
    return { data: await loader(), error: null };
  } catch (error) {
    return { data: null, error: getDashboardErrorMessage(error) };
  }
};

// Resume las citas operativas del día
const loadTodayAppointments = async ({ dateKey }) => {
  const snapshot = await getDocs(query(
    collection(db, 'citas'),
    where('fecha', '==', dateKey)
  ));
  const statusCounts = Object.fromEntries(
    appointmentStates.map((status) => [status, 0])
  );
  let warningCount = 0;

  snapshot.docs.forEach((documentSnapshot) => {
    const status = documentSnapshot.data().estado;

    if (!appointmentStates.includes(status)) {
      warningCount += 1;
      return;
    }

    statusCounts[status] += 1;
  });

  const activeCount = appointmentStates
    .filter((status) => !terminalAppointmentStates.has(status))
    .reduce((total, status) => total + statusCounts[status], 0);

  return {
    activeCount,
    pendingCount: statusCounts.por_confirmar,
    statusCounts,
    totalCount: snapshot.size - warningCount,
    warningCount
  };
};

// Resume los pagos confirmados del mes
const loadMonthlyPayments = async (period) => {
  const snapshot = await getDocs(query(
    collection(db, 'pagos'),
    where('fecha', '>=', period.monthStart),
    where('fecha', '<', period.nextMonthStart)
  ));
  let collectedMonthCents = 0;
  let collectedTodayCents = 0;
  let warningCount = 0;

  snapshot.docs.forEach((documentSnapshot) => {
    const payment = mapDashboardPayment(documentSnapshot.data());

    if (!payment) {
      warningCount += 1;
      return;
    }

    const nextMonthTotal = collectedMonthCents + payment.amountCents;

    if (!Number.isSafeInteger(nextMonthTotal)) {
      warningCount += 1;
      return;
    }

    collectedMonthCents = nextMonthTotal;

    if (
      payment.paidAt >= period.todayStart.getTime()
      && payment.paidAt < period.tomorrowStart.getTime()
    ) {
      collectedTodayCents += payment.amountCents;
    }
  });

  return {
    collectedMonthCents,
    collectedTodayCents,
    warningCount
  };
};

// Resume ventas del día y actividad reciente
const loadSales = async (period) => {
  const [todaySnapshot, recentSnapshot] = await Promise.all([
    getDocs(query(
      collection(db, 'ventas'),
      where('creadaEn', '>=', period.todayStart),
      where('creadaEn', '<', period.tomorrowStart)
    )),
    getDocs(query(
      collection(db, 'ventas'),
      orderBy('creadaEn', 'desc'),
      limit(10)
    ))
  ]);
  const mappedTodaySales = todaySnapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    sale: mapDashboardSale(documentSnapshot)
  }));
  const mappedRecentSales = recentSnapshot.docs.map((documentSnapshot) => ({
    id: documentSnapshot.id,
    sale: mapDashboardSale(documentSnapshot)
  }));
  const todaySales = mappedTodaySales
    .filter(({ sale }) => sale)
    .map(({ sale }) => sale);
  const recentSales = mappedRecentSales
    .filter(({ sale }) => sale)
    .map(({ sale }) => sale)
    .slice(0, 5);
  const invalidSaleIds = new Set(
    [...mappedTodaySales, ...mappedRecentSales]
      .filter(({ sale }) => !sale)
      .map(({ id }) => id)
  );
  let todayGrossCents = 0;
  let unsafeTotalCount = 0;

  todaySales.forEach((sale) => {
    const nextTotal = todayGrossCents + sale.totalCents;

    if (!Number.isSafeInteger(nextTotal)) {
      unsafeTotalCount += 1;
      return;
    }

    todayGrossCents = nextTotal;
  });

  return {
    recentSales,
    todayCount: todaySales.length,
    todayGrossCents,
    warningCount: invalidSaleIds.size + unsafeTotalCount
  };
};

// Resume productos activos que requieren atención
const loadLowStockProducts = async () => {
  const snapshot = await getDocs(query(
    collection(db, 'productos'),
    where('activo', '==', true)
  ));
  const products = [];
  let warningCount = 0;

  snapshot.docs.forEach((documentSnapshot) => {
    const product = mapDashboardProduct(documentSnapshot);

    if (!product) {
      warningCount += 1;
      return;
    }

    if (product.stock <= product.minimumStock) {
      products.push(product);
    }
  });

  products.sort((first, second) => (
    first.stock - second.stock
    || first.name.localeCompare(second.name, 'es')
  ));

  return {
    lowStockProducts: products,
    warningCount
  };
};

// Carga una fotografía administrativa bajo demanda
export const loadAdminDashboard = async () => {
  const period = getAdminDashboardPeriod();
  const [appointments, finances, sales, inventory] = await Promise.all([
    loadSection(() => loadTodayAppointments(period)),
    loadSection(() => loadMonthlyPayments(period)),
    loadSection(() => loadSales(period)),
    loadSection(loadLowStockProducts)
  ]);
  const hasUpdatedData = [
    appointments,
    finances,
    sales,
    inventory
  ].some((section) => section.data !== null);

  return {
    appointments,
    dateKey: period.dateKey,
    finances,
    inventory,
    loadedAt: hasUpdatedData ? new Date() : null,
    sales
  };
};
