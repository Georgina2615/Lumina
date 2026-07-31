import { AppointmentError } from './AppointmentError.js';

// Define el formato permitido para nombres reales
const CLIENT_NAME_PATTERN = new RegExp(
  "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’\\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$",
  'u'
);

// Define los tipos de identidad conocidos
const IDENTITY_TYPES = new Set(['telefono', 'correo']);

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Rechaza propiedades fuera del contrato
const assertAllowedKeys = (value, allowedKeys, message) => {
  // Busca una propiedad desconocida
  const invalidKey = Object.keys(value).find(
    (key) => !allowedKeys.includes(key)
  );

  // Detiene contratos con información adicional
  if (invalidKey) {
    fail('invalid-argument', message);
  }
};

// Normaliza el nombre completo
const normalizeFullName = (value) => {
  // Limpia espacios y composición unicode
  const normalized = typeof value === 'string'
    ? value.normalize('NFC').trim().replace(/\s+/g, ' ')
    : '';

  // Detiene nombres incompletos o artificiales
  if (
    normalized.length < 2
    || normalized.length > 150
    || !CLIENT_NAME_PATTERN.test(normalized)
  ) {
    fail(
      'invalid-argument',
      'El nombre solo puede contener letras espacios apóstrofes y guiones'
    );
  }

  // Devuelve el nombre canónico
  return normalized;
};

// Normaliza el teléfono nacional
const normalizePhone = (value) => {
  // Conserva únicamente dígitos
  const normalized = typeof value === 'string'
    ? value.replace(/\D/g, '')
    : '';

  // Detiene teléfonos fuera del contrato
  if (!/^\d{10}$/.test(normalized)) {
    fail('invalid-argument', 'El teléfono debe tener diez dígitos');
  }

  // Devuelve el teléfono canónico
  return normalized;
};

// Normaliza un correo opcional
const normalizeEmail = (value) => {
  // Limpia y estandariza el correo
  const normalized = typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';

  // Permite clientes sin correo
  if (!normalized) {
    // Devuelve ausencia canónica
    return '';
  }

  // Detiene correos fuera del contrato
  if (
    normalized.length > 254
    || normalized.includes('/')
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    fail('invalid-argument', 'El correo electrónico no es válido');
  }

  // Devuelve el correo canónico
  return normalized;
};

// Normaliza un identificador documental opcional
const normalizeClientId = (value) => {
  // Permite clientes todavía no registrados
  if (value === undefined || value === null || value === '') {
    // Devuelve ausencia canónica
    return null;
  }

  // Detiene rutas o identificadores excesivos
  if (
    typeof value !== 'string'
    || value.length > 500
    || value.includes('/')
  ) {
    fail('invalid-argument', 'El cliente seleccionado no es válido');
  }

  // Devuelve el identificador original
  return value;
};

// Normaliza el cliente recibido
export const normalizeAppointmentClient = (client) => {
  // Detiene contratos desconocidos
  if (!isRecord(client)) {
    fail('invalid-argument', 'Los datos del cliente no son válidos');
  }

  assertAllowedKeys(
    client,
    ['id', 'fullName', 'phone', 'email'],
    'Los datos del cliente contienen campos no permitidos'
  );

  // Devuelve la identidad canónica
  return {
    id: normalizeClientId(client.id),
    fullName: normalizeFullName(client.fullName),
    phone: normalizePhone(client.phone),
    email: normalizeEmail(client.email)
  };
};

// Construye las identidades deterministas
export const buildClientIdentities = (client) => {
  // Inicia con el teléfono obligatorio
  const identities = [{
    type: 'telefono',
    value: client.phone,
    id: `telefono:${client.phone}`
  }];

  // Añade el correo cuando existe
  if (client.email) {
    identities.push({
      type: 'correo',
      value: client.email,
      id: `correo:${client.email}`
    });
  }

  // Devuelve todas las identidades
  return identities;
};

// Verifica una identidad persistida
export const requireStoredIdentity = ({
  snapshot,
  identity
}) => {
  // Permite identidades todavía no registradas
  if (!snapshot.exists) {
    // Devuelve ausencia de propietario
    return null;
  }

  // Obtiene la identidad persistida
  const data = snapshot.data();

  // Detiene documentos inconsistentes
  if (
    !IDENTITY_TYPES.has(data.tipo)
    || data.tipo !== identity.type
    || data.valorNormalizado !== identity.value
    || typeof data.clienteId !== 'string'
    || !data.clienteId
  ) {
    fail(
      'failed-precondition',
      'Una identidad del cliente requiere corrección'
    );
  }

  // Devuelve el propietario vigente
  return data.clienteId;
};

// Verifica un cliente existente sin editarlo
export const requireStoredClient = ({
  snapshot,
  requestedClient,
  identities,
  identityOwners
}) => {
  // Detiene clientes ausentes o fusionados
  if (!snapshot.exists || snapshot.data().fusionado === true) {
    fail('failed-precondition', 'El cliente ya no está disponible');
  }

  // Obtiene el contacto persistido
  const data = snapshot.data();

  // Normaliza el contacto persistido
  const storedClient = {
    fullName: normalizeFullName(data.nombreCompleto),
    phone: normalizePhone(
      data.telefonoNormalizado || data.telefono
    ),
    email: normalizeEmail(
      Object.hasOwn(data, 'emailNormalizado')
        ? data.emailNormalizado
        : data.email
    )
  };

  // Impide editar contactos desde la agenda
  if (
    storedClient.fullName !== requestedClient.fullName
    || storedClient.phone !== requestedClient.phone
    || storedClient.email !== requestedClient.email
  ) {
    fail(
      'failed-precondition',
      'Actualiza los datos del cliente desde su perfil'
    );
  }

  // Verifica la propiedad de cada identidad
  identities.forEach((identity, index) => {
    // Detiene identidades ausentes o ajenas
    if (identityOwners[index] !== snapshot.id) {
      fail(
        'failed-precondition',
        'La identidad del cliente requiere actualización'
      );
    }
  });

  // Devuelve el cliente canónico
  return {
    id: snapshot.id,
    ...storedClient
  };
};
