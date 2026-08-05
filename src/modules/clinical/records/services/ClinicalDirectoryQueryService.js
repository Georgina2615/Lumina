import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import {
  mapClinicalDirectoryEntry,
  sortClinicalDirectory
} from './ClinicalDirectoryPolicy';
import {
  mapClinicalSession,
  sortClinicalSessions
} from '../../sessions/services/ClinicalSessionPolicy';
import {
  mapClinicalConsent,
  sortClinicalConsents
} from '../../consents/services/ClinicalConsentPolicy';

// Mantiene sincronizado el directorio clínico con Firebase
export const subscribeClinicalDirectory = ({ onData, onError }) => {
  let clientsSnapshot = null;
  let recordsSnapshot = null;
  let sessionsSnapshot = null;
  let consentsSnapshot = null;

  const publishDirectory = () => {
    if (!clientsSnapshot || !recordsSnapshot || !sessionsSnapshot || !consentsSnapshot) return;

    const recordsByClient = new Map(recordsSnapshot.docs.map((snapshot) => (
      [snapshot.id, snapshot.data()]
    )));
    const sessionsByClient = new Map();
    const consentsByClient = new Map();

    sessionsSnapshot.docs.forEach((snapshot) => {
      const session = mapClinicalSession(snapshot.id, snapshot.data());
      if (!session) return;
      const clientSessions = sessionsByClient.get(session.clientId) ?? [];
      clientSessions.push(session);
      sessionsByClient.set(session.clientId, clientSessions);
    });
    sessionsByClient.forEach((sessions, clientId) => {
      sessionsByClient.set(clientId, sortClinicalSessions(sessions));
    });
    consentsSnapshot.docs.forEach((snapshot) => {
      const consent = mapClinicalConsent(snapshot.id, snapshot.data());
      if (!consent) return;
      const clientConsents = consentsByClient.get(consent.clientId) ?? [];
      clientConsents.push(consent);
      consentsByClient.set(consent.clientId, clientConsents);
    });
    consentsByClient.forEach((consents, clientId) => {
      consentsByClient.set(clientId, sortClinicalConsents(consents));
    });
    const entries = clientsSnapshot.docs
      .filter((snapshot) => snapshot.data().fusionado !== true)
      .map((snapshot) => ({
        ...mapClinicalDirectoryEntry(
        snapshot,
        recordsByClient,
        sessionsByClient
        ),
        consents: consentsByClient.get(snapshot.id) ?? []
      }));

    onData(sortClinicalDirectory(entries));
  };

  const unsubscribeClients = onSnapshot(
    collection(db, 'clientes'),
    (snapshot) => {
      clientsSnapshot = snapshot;
      publishDirectory();
    },
    onError
  );
  const unsubscribeRecords = onSnapshot(
    collection(db, 'expedientesClinicos'),
    (snapshot) => {
      recordsSnapshot = snapshot;
      publishDirectory();
    },
    onError
  );
  const unsubscribeSessions = onSnapshot(
    collection(db, 'sesionesClinicas'),
    (snapshot) => {
      sessionsSnapshot = snapshot;
      publishDirectory();
    },
    onError
  );
  const unsubscribeConsents = onSnapshot(
    collection(db, 'consentimientosClinicos'),
    (snapshot) => {
      consentsSnapshot = snapshot;
      publishDirectory();
    },
    onError
  );

  return () => {
    unsubscribeClients();
    unsubscribeRecords();
    unsubscribeSessions();
    unsubscribeConsents();
  };
};
