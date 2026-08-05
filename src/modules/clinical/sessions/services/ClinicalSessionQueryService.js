import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import {
  createClinicalSessionForm,
  mapClinicalSession,
  sortClinicalSessions
} from './ClinicalSessionPolicy';

// Carga la cita la ficha y el seguimiento vigente
export const loadClinicalSession = async ({ appointmentId, clientId }) => {
  const [
    clientSnapshot,
    appointmentSnapshot,
    recordSnapshot,
    consentSnapshot,
    sessionSnapshot,
    clientSessionsSnapshot
  ] = await Promise.all([
    getDoc(doc(db, 'clientes', clientId)),
    getDoc(doc(db, 'citas', appointmentId)),
    getDoc(doc(db, 'expedientesClinicos', clientId)),
    getDoc(doc(db, 'consentimientosClinicos', appointmentId)),
    getDoc(doc(db, 'sesionesClinicas', appointmentId)),
    getDocs(query(
      collection(db, 'sesionesClinicas'),
      where('clientId', '==', clientId)
    ))
  ]);

  if (!clientSnapshot.exists() || !appointmentSnapshot.exists()) {
    throw new Error('La cita o la clienta ya no está disponible');
  }

  const client = clientSnapshot.data();
  const appointment = appointmentSnapshot.data();

  if (appointment.clienteId !== clientId || appointment.estado !== 'en_cabina') {
    throw new Error('La cita debe estar en cabina para abrir el seguimiento');
  }

  const storedSession = sessionSnapshot.exists()
    ? mapClinicalSession(sessionSnapshot.id, sessionSnapshot.data())
    : null;
  const record = recordSnapshot.exists() ? recordSnapshot.data() : null;
  const previousSession = sortClinicalSessions(clientSessionsSnapshot.docs
    .map((documentSnapshot) => mapClinicalSession(
      documentSnapshot.id,
      documentSnapshot.data()
    ))
    .filter((session) => (
      session
      && session.appointmentId !== appointmentId
      && session.status === 'completed'
    )))[0] ?? null;

  if (!record || record.clientId !== clientId || record.schemaVersion !== 1) {
    throw new Error('Crea la ficha técnica antes de abrir el seguimiento');
  }

  const consent = consentSnapshot.exists() ? consentSnapshot.data() : null;
  if (
    !consent
    || consent.clientId !== clientId
    || consent.appointmentId !== appointmentId
    || consent.status !== 'signed'
  ) {
    throw new Error('Firma el consentimiento antes de abrir el seguimiento');
  }

  const session = createClinicalSessionForm(storedSession, appointment.servicio);
  session.photoConsentGranted = consent.clinicalPhotosAllowed === true;

  return {
    appointment: {
      date: String(appointment.fecha ?? ''),
      id: appointmentId,
      service: String(appointment.servicio ?? ''),
      time: String(appointment.hora ?? '')
    },
    client: {
      id: clientId,
      name: String(client.nombreCompleto ?? 'Clienta sin nombre')
    },
    previousTreatment: storedSession?.previousTreatment
      ?? previousSession?.performedTreatment
      ?? '',
    recordStatus: record.status === 'completed' ? 'completed' : 'draft',
    revision: storedSession?.revision ?? 0,
    photoAllowed: consent.clinicalPhotosAllowed === true,
    session,
    status: storedSession?.status ?? 'draft'
  };
};

// Carga las sesiones reales de una clienta
export const loadClientClinicalSessions = async (clientId) => {
  const snapshot = await getDocs(query(
    collection(db, 'sesionesClinicas'),
    where('clientId', '==', clientId)
  ));

  return sortClinicalSessions(snapshot.docs
    .map((documentSnapshot) => mapClinicalSession(
      documentSnapshot.id,
      documentSnapshot.data()
    ))
    .filter(Boolean));
};
