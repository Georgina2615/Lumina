import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import {
  mapClinicalDirectoryEntry,
  sortClinicalDirectory
} from './ClinicalDirectoryPolicy';

// Mantiene sincronizado el directorio clínico con Firebase
export const subscribeClinicalDirectory = ({ onData, onError }) => {
  let clientsSnapshot = null;
  let recordsSnapshot = null;

  const publishDirectory = () => {
    if (!clientsSnapshot || !recordsSnapshot) return;

    const recordsByClient = new Map(recordsSnapshot.docs.map((snapshot) => (
      [snapshot.id, snapshot.data()]
    )));
    const entries = clientsSnapshot.docs
      .filter((snapshot) => snapshot.data().fusionado !== true)
      .map((snapshot) => mapClinicalDirectoryEntry(snapshot, recordsByClient));

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

  return () => {
    unsubscribeClients();
    unsubscribeRecords();
  };
};
