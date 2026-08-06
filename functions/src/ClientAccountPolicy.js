import { HttpsError } from 'firebase-functions/v2/https';

const maximumAppointments = 100;

// Obtiene un correo comprobado por Firebase
export const requireVerifiedClientEmail = (auth) => {
  const email = auth?.token?.email?.trim().toLowerCase();
  if (!auth?.uid || auth?.token?.email_verified !== true || !email) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión con un correo verificado'
    );
  }
  if (email.length > 254 || email.includes('/')) {
    throw new HttpsError('invalid-argument', 'El correo no es válido');
  }
  return email;
};

// Limita la cantidad de citas devueltas
export const getClientAppointmentLimit = () => maximumAppointments;

// Exige una identidad enlazada a una clienta
export const requireClientIdentity = (snapshot) => {
  const data = snapshot?.exists ? snapshot.data() : null;
  if (data?.tipo !== 'correo' || typeof data?.clienteId !== 'string') {
    throw new HttpsError(
      'not-found',
      'No encontramos un perfil asociado con este correo'
    );
  }
  return data.clienteId;
};

// Exige un perfil vigente de la clienta
export const requireClientProfile = (snapshot, email) => {
  const data = snapshot?.exists ? snapshot.data() : null;
  if (
    typeof data?.nombreCompleto !== 'string'
    || data.emailNormalizado !== email
    || data.fusionado === true
  ) {
    throw new HttpsError(
      'not-found',
      'No encontramos un perfil asociado con este correo'
    );
  }
  return data;
};
