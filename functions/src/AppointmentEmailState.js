// Define estados que no deben enviarse otra vez
const terminalStates = new Set([
  'enviado',
  'omitido',
  'fallido',
  'no_confirmado'
]);

// Define cierres permitidos
const completionStates = new Set([
  'enviado',
  'fallido',
  'no_confirmado'
]);

// Construye referencias del correo de cita
const buildReferences = ({ appointmentId, firestore }) => ({
  appointment: firestore.collection('citas').doc(appointmentId)
});

// Reclama un correo antes de contactar al proveedor
export const claimAppointmentEmail = async ({
  appointmentId,
  attemptId,
  firestore,
  serverTimestamp
}) => {
  const references = buildReferences({ appointmentId, firestore });
  return firestore.runTransaction(async (transaction) => {
    const appointmentSnapshot = await transaction.get(references.appointment);
    if (!appointmentSnapshot.exists) return { status: 'missing' };

    const appointment = appointmentSnapshot.data();
    const notification = appointment.notificacionRegistro ?? {};
    if (
      notification.estado === 'enviando'
      && notification.intentoId === attemptId
    ) {
      return { status: 'uncertain' };
    }
    if (terminalStates.has(notification.estado)) {
      return { status: 'skipped', emailStatus: notification.estado };
    }

    const clientId = typeof appointment.clienteId === 'string'
      ? appointment.clienteId
      : '';
    const clientReference = clientId
      ? firestore.collection('clientes').doc(clientId)
      : null;
    const clientSnapshot = clientReference
      ? await transaction.get(clientReference)
      : null;
    const client = clientSnapshot?.exists ? clientSnapshot.data() : null;
    const email = typeof client?.emailNormalizado === 'string'
      ? client.emailNormalizado.trim()
      : typeof client?.email === 'string'
        ? client.email.trim()
        : '';

    if (!email) {
      transaction.update(references.appointment, {
        notificacionRegistro: {
          estado: 'omitido',
          intentoId: null,
          intentos: 0,
          enviadoEn: null,
          ultimoIntentoEn: serverTimestamp(),
          ultimoError: ''
        }
      });
      return { status: 'omitido' };
    }

    const previousAttempts = Number.isSafeInteger(notification.intentos)
      ? notification.intentos
      : 0;
    transaction.update(references.appointment, {
      notificacionRegistro: {
        estado: 'enviando',
        intentoId: attemptId,
        intentos: previousAttempts + 1,
        enviadoEn: null,
        ultimoIntentoEn: serverTimestamp(),
        ultimoError: ''
      }
    });
    return { status: 'claimed', appointment, client };
  });
};

// Finaliza solo el intento vigente
export const completeAppointmentEmail = async ({
  appointmentId,
  attemptId,
  errorMessage = '',
  firestore,
  serverTimestamp,
  status
}) => {
  if (!completionStates.has(status)) {
    throw new Error('El cierre del correo no es válido');
  }

  const references = buildReferences({ appointmentId, firestore });
  return firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(references.appointment);
    if (!snapshot.exists) return { applied: false, emailStatus: 'missing' };

    const notification = snapshot.data().notificacionRegistro ?? {};
    if (
      notification.estado !== 'enviando'
      || notification.intentoId !== attemptId
    ) {
      return {
        applied: false,
        emailStatus: notification.estado ?? 'desconocido'
      };
    }

    transaction.update(references.appointment, {
      notificacionRegistro: {
        ...notification,
        estado: status,
        intentoId: null,
        enviadoEn: status === 'enviado' ? serverTimestamp() : null,
        ultimoError: errorMessage
      }
    });
    return { applied: true, emailStatus: status };
  });
};
