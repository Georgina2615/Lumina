import { collection, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../../config/firebase';

export const createAdminUser = async (payload) => {
  // Si se solicita crear también el usuario en Firebase Auth, usamos la callable
  if (payload.createAuth) {
    const callable = httpsCallable(functionsInstance, 'createAuthUser');
    const response = await callable({
      email: payload.correo,
      password: payload.password,
      displayName: payload.displayName ?? undefined,
      role: payload.rol
    });

    const { uid } = response.data || {};
    if (!uid) {
      throw new Error('No se pudo crear la cuenta de acceso');
    }

    const firestorePayload = {
      correo: payload.correo,
      rol: payload.rol,
      activo: payload.activo
    };

    const userRef = doc(db, 'usuarios', uid);
    await setDoc(userRef, firestorePayload);
    return uid;
  }

  // Evita persistir campos auxiliares en Firestore
  const firestorePayload = {
    correo: payload.correo,
    rol: payload.rol,
    activo: payload.activo
  };

  const userReference = doc(collection(db, 'usuarios'));
  await setDoc(userReference, firestorePayload);
  return userReference.id;
};

export const updateAdminUser = async (userId, payload) => {
  // Sanitiza payload para no almacenar contraseñas ni flags auxiliares
  const safePayload = {
    ...(payload.correo ? { correo: payload.correo } : {}),
    ...(payload.rol ? { rol: payload.rol } : {}),
    ...(typeof payload.activo === 'boolean' ? { activo: payload.activo } : {})
  };

  const userReference = doc(db, 'usuarios', userId);
  await updateDoc(userReference, safePayload);
  return userId;
};

export const deleteAdminUser = async (userId) => {
  const userReference = doc(db, 'usuarios', userId);
  await deleteDoc(userReference);
  return userId;
};

export const manageAuthUser = async ({ uid, action }) => {
  const callable = httpsCallable(functionsInstance, 'manageAuthUser');
  const result = await callable({ uid, action });
  return result.data;
};
