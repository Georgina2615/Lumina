import {
  BOOKING_BLOCK_MINUTES,
  DEPOSIT_PERCENTAGE,
  PREPARATION_MINUTES,
  SERVICE_DURATION_MINUTES
} from './AppointmentSchedulePolicy.js';
import {
  isValidPublicDescription,
  isValidServiceName,
  isValidServiceOrder,
  maximumServiceOrder,
  maximumServicePriceCents,
  ServiceCatalogError
} from './ServiceCatalogPolicy.js';

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new ServiceCatalogError(code, message);
};

// Normaliza un nombre para detectar duplicados
export const normalizeServiceName = (value) => (
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es-MX')
);

// Exige una administradora activa
export const requireServiceCatalogAdmin = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;

  if (actor?.activo !== true || actor?.rol !== 'admin') {
    fail('permission-denied', 'No tienes permisos para administrar servicios');
  }
};

// Exige un servicio disponible para cambios
export const requireStoredService = (snapshot, expectedRevision) => {
  if (!snapshot.exists) {
    fail('not-found', 'El servicio ya no existe');
  }

  const data = snapshot.data();
  const revision = Number.isSafeInteger(data.revision) ? data.revision : 0;

  if (revision !== expectedRevision) {
    fail('aborted', 'El servicio cambió y necesita actualizarse');
  }

  return { data, revision };
};

// Exige una identidad libre para un alta
export const requireAvailableServiceCreation = (snapshot) => {
  if (snapshot.exists) {
    fail('already-exists', 'El servicio ya existe');
  }
};

// Exige una configuracion valida antes de ofrecer el servicio
export const requireServiceCanActivate = (data) => {
  const name = typeof data.nombre === 'string'
    ? data.nombre.trim().replace(/\s+/g, ' ')
    : '';

  if (
    data.nombre !== name
    || !isValidServiceName(name)
    || !isValidPublicDescription(data.descripcionPublica ?? '')
    || !isValidServiceOrder(data.orden)
    || !Number.isSafeInteger(data.precioCentavos)
    || data.precioCentavos <= 0
    || data.precioCentavos > maximumServicePriceCents
    || data.duracionServicioMinutos !== SERVICE_DURATION_MINUTES
    || data.tiempoPreparacionMinutos !== PREPARATION_MINUTES
    || data.duracionBloqueMinutos !== BOOKING_BLOCK_MINUTES
    || data.porcentajeAnticipo !== DEPOSIT_PERCENTAGE
  ) {
    fail(
      'failed-precondition',
      'Edita el servicio antes de volver a ofrecerlo'
    );
  }
};

// Resuelve una posicion valida desde el catalogo
export const resolveServiceOrder = ({
  catalogSnapshot,
  serviceId,
  storedOrder
}) => {
  if (isValidServiceOrder(storedOrder)) {
    return storedOrder;
  }

  const lastOrder = catalogSnapshot.docs.reduce((maximum, snapshot) => {
    const order = snapshot.id === serviceId
      ? null
      : snapshot.data().orden;

    return isValidServiceOrder(order) ? Math.max(maximum, order) : maximum;
  }, 0);

  if (lastOrder >= maximumServiceOrder) {
    fail('resource-exhausted', 'No hay espacio para otro servicio');
  }

  return lastOrder + 1;
};

// Evita nombres repetidos dentro del catalogo
export const requireUniqueServiceName = ({
  catalogSnapshot,
  name,
  serviceId
}) => {
  const comparableName = normalizeServiceName(name);
  const duplicate = catalogSnapshot.docs.some((documentSnapshot) => (
    documentSnapshot.id !== serviceId
    && normalizeServiceName(documentSnapshot.data().nombre) === comparableName
  ));

  if (duplicate) {
    fail('already-exists', 'Ya existe un servicio con ese nombre');
  }
};

// Reconoce un reintento de la misma operacion
export const mapExistingServiceOperation = ({
  actorUid,
  operationSnapshot,
  requestHash,
  serviceId
}) => {
  if (!operationSnapshot.exists) {
    return null;
  }

  const operation = operationSnapshot.data();

  if (
    operation.actorUid !== actorUid
    || operation.servicioId !== serviceId
    || operation.idempotencia?.hashSolicitud !== requestHash
    || !operation.resultado
  ) {
    fail('already-exists', 'La operación ya fue utilizada');
  }

  return { ...operation.resultado, alreadyProcessed: true };
};
