import {
  normalizeEmail,
  normalizePhone
} from './ClientService';

// Define el formato permitido para nombres reales
export const clientNamePatternSource = "[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’\\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*";

// Explica el formato requerido al usuario
export const clientNameErrorMessage = 'El nombre solo puede contener letras espacios apóstrofes y guiones';

// Compila la validación canónica del nombre
const clientNamePattern = new RegExp(
  `^(?:${clientNamePatternSource})$`,
  'u'
);

// Normaliza el nombre del cliente
const normalizeFullName = (fullName) => {
  // Limpia espacios repetidos
  const value = String(fullName ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');
  // Detiene nombres fuera de rango
  if (value.length < 2 || value.length > 150) {
    throw new Error('Escribe el nombre completo del cliente');
  }
  // Detiene caracteres ajenos a una identidad
  if (!clientNamePattern.test(value)) {
    throw new Error(clientNameErrorMessage);
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
