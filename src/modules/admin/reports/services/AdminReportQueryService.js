import {
  collection,
  documentId,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import {
  calculateAdminReportTotals
} from './AdminReportCalculationService';
import {
  mapAdminReportClientName,
  mapAdminReportPayment,
  mapAdminReportSale
} from './AdminReportMapperService';
import { getAdminReportPeriod } from './AdminReportPeriodService';

const CLIENT_QUERY_LIMIT = 30;

// Separa un arreglo en consultas permitidas por Firestore
const createBatches = (values, batchSize) => {
  const batches = [];

  for (let index = 0; index < values.length; index += batchSize) {
    batches.push(values.slice(index, index + batchSize));
  }

  return batches;
};

// Consulta nombres de clientes en grupos pequeños
const loadClientNames = async (clientIds) => {
  const uniqueIds = [...new Set(clientIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const snapshots = await Promise.all(
    createBatches(uniqueIds, CLIENT_QUERY_LIMIT).map((batch) => getDocs(query(
      collection(db, 'clientes'),
      where(documentId(), 'in', batch)
    )))
  );
  const names = new Map();

  snapshots.forEach((snapshot) => {
    snapshot.docs.forEach((documentSnapshot) => {
      const name = mapAdminReportClientName(documentSnapshot);

      if (name) {
        names.set(documentSnapshot.id, name);
      }
    });
  });

  return names;
};

// Convierte pagos y ventas en un reporte consistente
const buildReport = async (paymentSnapshot, salesSnapshot) => {
  const mappedPayments = paymentSnapshot.docs.map(mapAdminReportPayment);
  const mappedSales = salesSnapshot.docs.map(mapAdminReportSale);
  const mappedValidPayments = mappedPayments.filter(Boolean);
  const validSales = mappedSales.filter(Boolean);
  const {
    acceptedPayments,
    totals,
    unsafePaymentCount
  } = calculateAdminReportTotals(mappedValidPayments);
  const clientNames = await loadClientNames(
    acceptedPayments.map((payment) => payment.clientId)
  );
  const payments = acceptedPayments.map((payment) => ({
    amountCents: payment.amountCents,
    clientName: payment.clientId
      ? clientNames.get(payment.clientId) ?? 'Cliente no disponible'
      : 'Mostrador',
    id: payment.id,
    methods: payment.methods,
    paidAt: payment.paidAt,
    reference: payment.reference,
    type: payment.type
  }));

  payments.sort((first, second) => (
    second.paidAt.getTime() - first.paidAt.getTime()
    || first.id.localeCompare(second.id)
  ));

  return {
    payments,
    ...totals,
    salesCount: validSales.length,
    warningCount: paymentSnapshot.size - mappedValidPayments.length
      + salesSnapshot.size - validSales.length
      + unsafePaymentCount
  };
};

// Carga pagos y ventas reales dentro del rango seleccionado
export const loadAdminPaymentsReport = async (
  periodKey,
  now = new Date()
) => {
  const period = getAdminReportPeriod(periodKey, now);
  const [paymentSnapshot, salesSnapshot] = await Promise.all([
    getDocs(query(
      collection(db, 'pagos'),
      where('fecha', '>=', period.start),
      where('fecha', '<', period.end)
    )),
    getDocs(query(
      collection(db, 'ventas'),
      where('creadaEn', '>=', period.start),
      where('creadaEn', '<', period.end)
    ))
  ]);

  return buildReport(paymentSnapshot, salesSnapshot);
};
