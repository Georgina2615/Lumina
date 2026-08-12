import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

// Crea un usuario en Firebase Auth de forma segura y opcionalmente asigna rol
export const createAuthUserHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para crear usuarios');
  }

  const callerUid = auth.uid;

  try {
    const callerRef = firestore.collection('usuarios').doc(callerUid);
    const callerSnap = await callerRef.get();

    if (!callerSnap.exists) {
      throw new HttpsError('permission-denied', 'Cuenta sin permisos');
    }

    const callerData = callerSnap.data();
    if (callerData?.rol !== 'admin' || callerData?.activo !== true) {
      throw new HttpsError('permission-denied', 'Cuenta sin permisos de administrador');
    }
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error('Error verificando usuario llamador', { callerUid, error: err });
    throw new HttpsError('internal', 'No se pudo verificar permisos');
  }

  const { email, password, displayName, role } = data ?? {};
  if (!email || typeof email !== 'string') {
    throw new HttpsError('invalid-argument', 'Falta correo');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new HttpsError('invalid-argument', 'Contraseña inválida (mínimo 6 caracteres)');
  }

  try {
    const authAdmin = getAuth();
    const user = await authAdmin.createUser({
      email,
      password,
      displayName: displayName || undefined
    });

    if (role && typeof role === 'string') {
      try {
        await authAdmin.setCustomUserClaims(user.uid, { role });
      } catch (e) {
        logger.warn('No se pudo asignar custom claims al nuevo usuario', { uid: user.uid, error: e });
      }
    }

    return { uid: user.uid };
  } catch (error) {
    logger.error('Fallo al crear usuario Auth', { email, error });
    throw new HttpsError('internal', 'No se pudo crear el usuario en Auth');
  }
};
