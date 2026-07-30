import {
  normalizeEmail,
  normalizePhone
} from './ClientService';

// Normaliza el nombre del cliente
const normalizeFullName = (fullName) => {
  // Limpia espacios repetidos
  const value = String(fullName ?? '').trim().replace(/\s+/g, ' ');
  // Detiene nombres fuera de rango
  if (value.length < 2 || value.length > 150) {
    throw new Error('Escribe el nombre completo del cliente');
  }
  // Devuelve el nombre canónico
  return value;
};

// Normaliza un cliente capturado en recepción
export const normalizeNewBookingClient = (client) => ({
  fullName: normalizeFullName(client?.fullName),
  phone: normalizePhone(client?.phone),
  email: normalizeEmail(client?.email)
});

// Normaliza un cliente leído desde Firestore
export const normalizeStoredBookingClient = (storedClient) => ({
  fullName: normalizeFullName(storedClient.nombreCompleto),
  phone: normalizePhone(
    storedClient.telefonoNormalizado || storedClient.telefono
  ),
  email: normalizeEmail(
    Object.hasOwn(storedClient, 'emailNormalizado')
      ? storedClient.emailNormalizado
      : storedClient.email
  )
});

// Construye las identidades requeridas
export const buildBookingIdentityValues = (client) => {
  // Inicia con la identidad telefónica
  const identities = [{
    type: 'telefono',
    value: client.phone
  }];
  // Añade la identidad de correo cuando existe
  if (client.email) {
    identities.push({
      type: 'correo',
      value: client.email
    });
  }
  // Devuelve las identidades canónicas
  return identities;
};
