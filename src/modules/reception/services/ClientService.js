import {
  collection, deleteField, doc, getDoc, onSnapshot, runTransaction, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const CLIENTS_COLLECTION = 'clientes';
const IDENTITIES_COLLECTION = 'identidadesClientes';
const IDENTITY_TYPES = new Set(['telefono', 'correo']);

const requireActorUid = (actorUid) => {
  if (!actorUid) {
    throw new Error('No se pudo identificar a la persona responsable');
  }
};

const getTimestampValue = (value) => {
  if (typeof value?.toMillis === 'function') {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
};

const getOwnedIdentity = (snapshot, clientId) => (
  snapshot?.exists() && snapshot.data().clienteId === clientId
);

const safelyNormalizePhone = (phone) => {
  try {
    return normalizePhone(phone);
  } catch {
    return null;
  }
};

const safelyNormalizeEmail = (email) => {
  try {
    return normalizeEmail(email);
  } catch {
    return null;
  }
};

// Normaliza el teléfono usado en documentos y alias
export const normalizePhone = (phone) => {
  const normalizedPhone = String(phone ?? '').replace(/\D/g, '');

  if (!/^\d{10}$/.test(normalizedPhone)) {
    throw new Error('El teléfono debe tener diez dígitos');
  }

  return normalizedPhone;
};

// Normaliza el correo usado en documentos y alias
export const normalizeEmail = (email) => {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  if (
    normalizedEmail.length > 254
    || normalizedEmail.includes('/')
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    throw new Error('El correo electrónico no es válido');
  }

  return normalizedEmail;
};

// Construye la referencia determinista de una identidad
export const getClientIdentityReference = (type, value) => {
  if (!IDENTITY_TYPES.has(type)) {
    throw new Error('El tipo de identidad no es válido');
  }

  return doc(db, IDENTITIES_COLLECTION, `${type}:${value}`);
};

// Construye la identidad con autoría
export const buildClientIdentityData = ({
  clientId,
  type,
  value,
  actorUid
}) => ({
  clienteId: clientId,
  tipo: type,
  valorNormalizado: value,
  creadaEn: serverTimestamp(),
  creadaPor: actorUid
});

// Escucha clientes vigentes y oculta fusiones
export const subscribeClients = ({ onData, onError }) => (
  onSnapshot(
    collection(db, CLIENTS_COLLECTION),
    (snapshot) => {
      const clients = snapshot.docs
        .map((documentSnapshot) => ({
          id: documentSnapshot.id,
          ...documentSnapshot.data()
        }))
        .filter((client) => client.fusionado !== true)
        .sort((first, second) => (
          getTimestampValue(second.fechaRegistro)
          - getTimestampValue(first.fechaRegistro)
        ));

      onData(clients);
    },
    onError
  )
);

// Busca al cliente por su alias telefónico
export const findClientByPhone = async (phone) => {
  const normalizedPhone = normalizePhone(phone);
  const identityReference = getClientIdentityReference(
    'telefono',
    normalizedPhone
  );
  const identitySnapshot = await getDoc(identityReference);

  if (!identitySnapshot.exists()) {
    return null;
  }

  const clientId = identitySnapshot.data().clienteId;

  if (!clientId) {
    return null;
  }

  const clientSnapshot = await getDoc(doc(db, CLIENTS_COLLECTION, clientId));

  if (!clientSnapshot.exists() || clientSnapshot.data().fusionado === true) {
    return null;
  }

  return {
    id: clientSnapshot.id,
    ...clientSnapshot.data()
  };
};

// Reemplaza el contacto y sus alias de forma atómica
export const updateClientContact = async ({
  clientId,
  phone,
  email,
  actorUid
}) => {
  requireActorUid(actorUid);

  if (!clientId) {
    throw new Error('No se pudo identificar al cliente');
  }

  const normalizedPhone = normalizePhone(phone);
  const normalizedEmail = normalizeEmail(email);
  const clientReference = doc(db, CLIENTS_COLLECTION, clientId);

  return runTransaction(db, async (transaction) => {
    const clientSnapshot = await transaction.get(clientReference);

    if (!clientSnapshot.exists()) {
      throw new Error('El cliente ya no existe');
    }

    const client = clientSnapshot.data();

    if (client.fusionado === true) {
      throw new Error('El cliente ya no está disponible');
    }

    const previousPhone = safelyNormalizePhone(client.telefono);
    const previousEmail = Object.hasOwn(client, 'emailNormalizado')
      ? safelyNormalizeEmail(client.emailNormalizado)
      : safelyNormalizeEmail(client.email);
    const nextPhoneReference = getClientIdentityReference(
      'telefono',
      normalizedPhone
    );
    const nextEmailReference = normalizedEmail
      ? getClientIdentityReference('correo', normalizedEmail)
      : null;
    const previousPhoneReference = previousPhone
      ? getClientIdentityReference('telefono', previousPhone)
      : null;
    const previousEmailReference = previousEmail
      ? getClientIdentityReference('correo', previousEmail)
      : null;
    const references = [
      nextPhoneReference,
      nextEmailReference,
      previousPhoneReference,
      previousEmailReference
    ].filter(Boolean);
    const uniqueReferences = [...new Map(
      references.map((reference) => [reference.path, reference])
    ).values()];
    const identitySnapshots = await Promise.all(
      uniqueReferences.map((reference) => transaction.get(reference))
    );
    const snapshotsByPath = new Map(
      identitySnapshots.map((snapshot) => [snapshot.ref.path, snapshot])
    );
    const nextPhoneSnapshot = snapshotsByPath.get(nextPhoneReference.path);
    const nextEmailSnapshot = nextEmailReference
      ? snapshotsByPath.get(nextEmailReference.path)
      : null;
    const contactChanged = (
      previousPhone !== normalizedPhone
      || (previousEmail ?? '') !== (normalizedEmail ?? '')
      || client.emailPendienteCorreccion === true
    );

    if (
      nextPhoneSnapshot.exists()
      && !getOwnedIdentity(nextPhoneSnapshot, clientId)
    ) {
      throw new Error('El teléfono ya pertenece a otro cliente');
    }

    if (
      nextEmailSnapshot?.exists()
      && !getOwnedIdentity(nextEmailSnapshot, clientId)
    ) {
      throw new Error('El correo ya pertenece a otro cliente');
    }

    if (!contactChanged) {
      if (!nextPhoneSnapshot.exists() || (
        nextEmailReference && !nextEmailSnapshot.exists()
      )) {
        throw new Error('La identidad del cliente requiere migración');
      }
      return true;
    }

    if (previousPhoneReference?.path !== nextPhoneReference.path) {
      const previousSnapshot = snapshotsByPath.get(
        previousPhoneReference?.path
      );

      if (getOwnedIdentity(previousSnapshot, clientId)) {
        transaction.delete(previousPhoneReference);
      }
    }

    if (previousEmailReference?.path !== nextEmailReference?.path) {
      const previousSnapshot = snapshotsByPath.get(
        previousEmailReference?.path
      );

      if (getOwnedIdentity(previousSnapshot, clientId)) {
        transaction.delete(previousEmailReference);
      }
    }

    if (!nextPhoneSnapshot.exists()) {
      transaction.set(nextPhoneReference, buildClientIdentityData({
        clientId,
        type: 'telefono',
        value: normalizedPhone,
        actorUid
      }));
    }

    if (nextEmailReference && !nextEmailSnapshot.exists()) {
      transaction.set(nextEmailReference, buildClientIdentityData({
        clientId,
        type: 'correo',
        value: normalizedEmail,
        actorUid
      }));
    }

    transaction.update(clientReference, {
      telefono: normalizedPhone,
      telefonoNormalizado: normalizedPhone,
      email: normalizedEmail ?? '',
      emailNormalizado: normalizedEmail ?? '',
      emailPendienteCorreccion: deleteField(),
      actualizadaEn: serverTimestamp(),
      actualizadaPor: actorUid
    });

    return true;
  });
};
