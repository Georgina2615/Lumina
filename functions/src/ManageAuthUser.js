import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';

// Maneja acciones seguras sobre usuarios de Firebase Auth: disable/enable/delete
export const manageAuthUserHandler = async ({ auth, data, firestore }) => {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Inicia sesión para administrar usuarios');
  }

  const callerUid = auth.uid;

  // Verifica que el llamador sea un administrador activo en Firestore
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

  // Valida datos entrantes
  const { uid, action } = data ?? {};
  if (!uid || typeof uid !== 'string') {
    throw new HttpsError('invalid-argument', 'Falta uid del usuario objetivo');
  }

  if (!['disable', 'enable', 'delete'].includes(action)) {
    throw new HttpsError('invalid-argument', 'Acción inválida');
  }

  try {
    const authAdmin = getAuth();

    if (action === 'disable') {
      await authAdmin.updateUser(uid, { disabled: true });
      return { success: true, action: 'disabled' };
    }

    if (action === 'enable') {
      await authAdmin.updateUser(uid, { disabled: false });
      return { success: true, action: 'enabled' };
    }

    if (action === 'delete') {
      // Borra el usuario de Auth
      await authAdmin.deleteUser(uid);
      // Opcional: borrar documento de Firestore si existe
      try {
        await firestore.collection('usuarios').doc(uid).delete();
      } catch (e) {
        // No bloquear la operación si la eliminación del documento falla
        logger.warn('No se pudo eliminar doc usuarios/{uid} tras borrar Auth', { uid, error: e });
      }

      return { success: true, action: 'deleted' };
    }
  } catch (error) {
    logger.error('Fallo al administrar usuario Auth', { uid, action, error });
    throw new HttpsError('internal', 'No se pudo administrar el usuario');
  }
};
