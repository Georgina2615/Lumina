import { AppointmentError } from './AppointmentError.js';
import {
  BOOKING_BLOCK_MINUTES,
  DEPOSIT_PERCENTAGE,
  PREPARATION_MINUTES,
  SERVICE_DURATION_MINUTES
} from './AppointmentSchedulePolicy.js';

// Define el máximo monetario aceptado
const MAX_SERVICE_PRICE_CENTS = 100_000_000;

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Verifica los permisos vigentes del actor
export const requireAppointmentActor = (snapshot) => {
  // Detiene usuarios ausentes
  if (!snapshot.exists) {
    fail(
      'permission-denied',
      'No tienes permisos para registrar citas'
    );
  }

  // Obtiene el perfil operativo
  const data = snapshot.data();

  // Detiene usuarios inactivos o sin rol permitido
  if (
    data.activo !== true
    || !['admin', 'recepcion'].includes(data.rol)
  ) {
    fail(
      'permission-denied',
      'No tienes permisos para registrar citas'
    );
  }
};

// Verifica la configuración canónica del servicio
export const requireAppointmentService = (snapshot) => {
  // Detiene servicios ausentes o inactivos
  if (!snapshot.exists || snapshot.data().activo !== true) {
    fail('not-found', 'El servicio ya no está disponible');
  }

  // Obtiene el servicio persistido
  const data = snapshot.data();

  // Normaliza el nombre visible
  const name = typeof data.nombre === 'string'
    ? data.nombre.trim()
    : '';

  // Detiene configuraciones incompatibles
  if (
    name.length < 2
    || name.length > 120
    || !Number.isSafeInteger(data.precioCentavos)
    || data.precioCentavos <= 0
    || data.precioCentavos > MAX_SERVICE_PRICE_CENTS
    || data.duracionServicioMinutos !== SERVICE_DURATION_MINUTES
    || data.tiempoPreparacionMinutos !== PREPARATION_MINUTES
    || data.duracionBloqueMinutos !== BOOKING_BLOCK_MINUTES
    || data.porcentajeAnticipo !== DEPOSIT_PERCENTAGE
  ) {
    fail(
      'failed-precondition',
      'El servicio no tiene una configuración válida'
    );
  }

  // Devuelve el servicio canónico
  return {
    id: snapshot.id,
    name,
    priceCents: data.precioCentavos,
    serviceDurationMinutes: data.duracionServicioMinutos,
    preparationMinutes: data.tiempoPreparacionMinutos,
    blockDurationMinutes: data.duracionBloqueMinutos,
    depositPercentage: data.porcentajeAnticipo
  };
};

// Detiene horarios ocupados
export const requireAvailableSlot = (snapshot) => {
  // Rechaza cualquier documento existente
  if (snapshot.exists) {
    fail('already-exists', 'El horario acaba de ser ocupado');
  }
};

// Resuelve el cliente mediante sus identidades
export const resolveAppointmentClientId = ({
  requestedClientId,
  identityOwners
}) => {
  // Reúne propietarios sin repetirlos
  const owners = [...new Set(identityOwners.filter(Boolean))];

  // Detiene identidades pertenecientes a clientes distintos
  if (owners.length > 1) {
    fail(
      'already-exists',
      'El teléfono y el correo pertenecen a clientes diferentes'
    );
  }

  // Obtiene el propietario encontrado
  const identityClientId = owners[0] ?? null;

  // Detiene selecciones que intentan adoptar otra identidad
  if (
    requestedClientId
    && identityClientId
    && requestedClientId !== identityClientId
  ) {
    fail(
      'already-exists',
      'Los datos de contacto ya pertenecen a otro cliente'
    );
  }

  // Prioriza el identificador verificado
  return identityClientId ?? requestedClientId ?? null;
};
