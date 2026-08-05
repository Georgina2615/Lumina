import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { calculateAdminReportTotals } from '../../services/AdminReportCalculationService';
import { mapAdminReportPayment } from '../../services/AdminReportMapperService';
import { getCashCloseDateRange } from './AdminCashClosePolicy';

// Convierte un corte guardado para la pantalla
const mapCashClose = (snapshot) => {
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const methods = data.cobrosPorMetodoCentavos;

  if (
    data.schemaVersion !== 1
    || data.fecha !== snapshot.id
    || !Number.isSafeInteger(data.revision)
    || !methods
  ) return null;

  return {
    id: snapshot.id,
    dateKey: data.fecha,
    revision: data.revision,
    openingCashCents: data.dineroInicialCentavos,
    withdrawalsCents: data.retirosCentavos,
    countedCashCents: data.efectivoContadoCentavos,
    expectedCashCents: data.efectivoEsperadoCentavos,
    differenceCents: data.diferenciaEfectivoCentavos,
    methodTotals: methods,
    totalCents: data.totalCobradoCentavos,
    paymentCount: data.cantidadCobros,
    updatedAt: data.actualizadoEn?.toDate?.() ?? null
  };
};

// Consulta un dia y su corte guardado
export const loadAdminCashCloseDay = async (dateKey) => {
  const { start, end } = getCashCloseDateRange(dateKey);
  const [paymentSnapshot, closeSnapshot] = await Promise.all([
    getDocs(query(
      collection(db, 'pagos'),
      where('fecha', '>=', start),
      where('fecha', '<', end)
    )),
    getDoc(doc(db, 'cortesCaja', dateKey))
  ]);
  const mappedPayments = paymentSnapshot.docs.map(mapAdminReportPayment);
  const validPayments = mappedPayments.filter(Boolean);
  const { totals, unsafePaymentCount } = calculateAdminReportTotals(validPayments);

  return {
    close: mapCashClose(closeSnapshot),
    paymentCount: validPayments.length,
    paymentTotals: totals.methodTotals,
    totalCents: totals.totalReceivedCents,
    warningCount: paymentSnapshot.size - validPayments.length + unsafePaymentCount
  };
};

// Consulta los cortes recientes
export const loadRecentAdminCashCloses = async () => {
  const snapshot = await getDocs(query(
    collection(db, 'cortesCaja'),
    orderBy('fecha', 'desc'),
    limit(12)
  ));

  return snapshot.docs.map(mapCashClose).filter(Boolean);
};
