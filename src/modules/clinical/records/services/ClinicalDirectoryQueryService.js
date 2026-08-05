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

// Mantiene sincronizado el directorio clínico con Firebase
export const subscribeClinicalDirectory = ({ onData, onError }) => {
  let clientsSnapshot = null;
  let recordsSnapshot = null;
  let sessionsSnapshot = null;

  const publishDirectory = () => {
    if (!clientsSnapshot || !recordsSnapshot || !sessionsSnapshot) return;

    const recordsByClient = new Map(recordsSnapshot.docs.map((snapshot) => (
      [snapshot.id, snapshot.data()]
    )));
    const sessionsByClient = new Map();

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
    const entries = clientsSnapshot.docs
      .filter((snapshot) => snapshot.data().fusionado !== true)
      .map((snapshot) => mapClinicalDirectoryEntry(
        snapshot,
        recordsByClient,
        sessionsByClient
      ));

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

  return () => {
    unsubscribeClients();
    unsubscribeRecords();
    unsubscribeSessions();
  };
};
