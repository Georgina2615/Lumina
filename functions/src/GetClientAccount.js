import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildInvoiceStatusMap,
  buildVisibleAppointment,
  buildVisibleClient,
  buildVisibleSale,
  sortVisibleAppointments,
  sortVisibleSales
} from './ClientAccountDocuments.js';
import {
  getClientAppointmentLimit,
  getClientSaleLimit,
  requireClientIdentity,
  requireClientProfile,
  requireVerifiedClientEmail
} from './ClientAccountPolicy.js';

// Consulta únicamente los datos de la clienta autenticada
export const getClientAccountHandler = async ({ auth, firestore }) => {
  const email = requireVerifiedClientEmail(auth);
  const identityReference = firestore.collection('identidadesClientes')
    .doc(`correo:${email}`);
  const identitySnapshot = await identityReference.get();
  const clientId = requireClientIdentity(identitySnapshot);
  const clientReference = firestore.collection('clientes').doc(clientId);
  const clientSnapshot = await clientReference.get();
  const client = requireClientProfile(clientSnapshot, email);

  try {
    const [appointmentSnapshot, saleSnapshot, invoiceSnapshot] = await Promise.all([
      firestore.collection('citas')
        .where('clienteId', '==', clientId)
        .limit(getClientAppointmentLimit())
        .get(),
      firestore.collection('ventas')
        .where('clienteId', '==', clientId)
        .limit(getClientSaleLimit())
        .get(),
      firestore.collection('solicitudesFactura')
        .where('clienteId', '==', clientId)
        .limit(getClientSaleLimit())
        .get()
    ]);
    const appointments = sortVisibleAppointments(
      appointmentSnapshot.docs.map(buildVisibleAppointment)
    );
    const invoiceStatuses = buildInvoiceStatusMap(invoiceSnapshot.docs);
    const sales = sortVisibleSales(
      saleSnapshot.docs.map((snapshot) => (
        buildVisibleSale(snapshot, invoiceStatuses)
      )).filter(Boolean)
    );
    return {
      client: buildVisibleClient({ clientId, data: client, email }),
      appointments,
      sales
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      'internal',
      'No pudimos consultar tu información en este momento'
    );
  }
};
