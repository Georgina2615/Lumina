import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildVisibleAppointment,
  buildVisibleClient,
  sortVisibleAppointments
} from './ClientAccountDocuments.js';
import {
  getClientAppointmentLimit,
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
    const appointmentSnapshot = await firestore.collection('citas')
      .where('clienteId', '==', clientId)
      .limit(getClientAppointmentLimit())
      .get();
    const appointments = sortVisibleAppointments(
      appointmentSnapshot.docs.map(buildVisibleAppointment)
    );
    return {
      client: buildVisibleClient({ clientId, data: client, email }),
      appointments
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      'internal',
      'No pudimos consultar tus citas en este momento'
    );
  }
};
