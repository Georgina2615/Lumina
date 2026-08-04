import {
  ScheduleAvailabilityError
} from './ScheduleAvailabilityPolicy.js';

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new ScheduleAvailabilityError(code, message);
};

// Exige una administradora activa
export const requireScheduleAvailabilityAdmin = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;

  if (actor?.activo !== true || actor?.rol !== 'admin') {
    fail(
      'permission-denied',
      'No tienes permisos para cambiar la disponibilidad'
    );
  }
};

// Reconoce un bloqueo administrativo vigente
export const isAdministrativeBlock = (snapshot) => (
  snapshot.exists && snapshot.data().tipo === 'bloqueo_admin'
);

// Exige un horario libre para bloquear
export const requireAvailableScheduleSlot = (snapshot) => {
  if (!snapshot.exists) {
    return;
  }

  if (isAdministrativeBlock(snapshot)) {
    fail('already-exists', 'El horario ya está bloqueado');
  }

  fail('already-exists', 'El horario ya tiene una cita');
};

// Exige un bloqueo administrativo para reabrir
export const requireAdministrativeBlock = (snapshot) => {
  if (!snapshot.exists) {
    fail('not-found', 'El horario ya está disponible');
  }

  if (!isAdministrativeBlock(snapshot)) {
    fail(
      'failed-precondition',
      'El horario pertenece a una cita y no puede reabrirse aquí'
    );
  }

  return snapshot.data();
};

// Exige al menos un horario libre en el dia
export const requireAffectedScheduleSlots = (slots) => {
  if (!slots.length) {
    fail(
      'failed-precondition',
      'No hay horarios libres para bloquear en esa fecha'
    );
  }
};

// Reconoce un reintento exacto de la operacion
export const mapExistingAvailabilityOperation = ({
  actorUid,
  operationSnapshot,
  requestHash
}) => {
  if (!operationSnapshot.exists) {
    return null;
  }

  const operation = operationSnapshot.data();

  if (
    operation.actorUid !== actorUid
    || operation.idempotencia?.hashSolicitud !== requestHash
    || !operation.resultado
  ) {
    fail('already-exists', 'La operación ya fue utilizada');
  }

  return { ...operation.resultado, alreadyProcessed: true };
};
