import {
  collection,
  documentId,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Divide identidades para respetar el límite de consultas
const chunkClientIds = (clientIds, size = 30) => {
  const chunks = [];

  for (let index = 0; index < clientIds.length; index += size) {
    chunks.push(clientIds.slice(index, index + size));
  }

  return chunks;
};

// Convierte clientes reales en contactos mínimos
const mapClientContacts = (snapshot) => (
  snapshot.docs.map((clientSnapshot) => {
    const client = clientSnapshot.data();

    return {
      id: clientSnapshot.id,
      phone: typeof client.telefono === 'string' ? client.telefono : '',
      email: typeof client.email === 'string' ? client.email : ''
    };
  })
);

// Escucha únicamente los contactos necesarios del tablero
export const subscribeAppointmentClientContacts = ({
  clientIds,
  onData,
  onError
}) => {
  // Devuelve un resultado estable sin clientes
  if (clientIds.length === 0) {
    onData({});
    return () => {};
  }

  // Conserva resultados independientes por grupo
  const contactsByChunk = new Map();
  const loadedChunks = new Set();
  const chunks = chunkClientIds(clientIds);

  // Publica contactos cuando todos los grupos respondieron
  const publishContacts = () => {
    if (loadedChunks.size !== chunks.length) {
      return;
    }

    const contacts = {};
    contactsByChunk.forEach((chunkContacts) => {
      chunkContacts.forEach((contact) => {
        contacts[contact.id] = contact;
      });
    });
    onData(contacts);
  };

  // Crea una escucha por cada grupo permitido
  const unsubscribeCallbacks = chunks.map((chunk, index) => {
    const clientsQuery = query(
      collection(db, 'clientes'),
      where(documentId(), 'in', chunk)
    );

    return onSnapshot(clientsQuery, (snapshot) => {
      contactsByChunk.set(index, mapClientContacts(snapshot));
      loadedChunks.add(index);
      publishContacts();
    }, onError);
  });

  // Detiene todas las escuchas
  return () => {
    unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
  };
};
