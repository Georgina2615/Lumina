import {
  CABIN_BRANCH_ID,
  CABIN_UNIT_SCALES
} from './CabinInventoryCalculations.js';
import { CabinInventoryError } from './CabinInventoryError.js';

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new CabinInventoryError(code, message);
};

// Reconoce cantidades escaladas válidas
const isScaledQuantity = (value) => (
  Number.isSafeInteger(value) && value >= 0 && value <= 999_999_999
);

// Reconoce valores monetarios válidos
const isInventoryValue = (value) => (
  Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000
);

// Verifica que el actor sea administrador activo
export const requireCabinInventoryAdmin = (snapshot) => {
  const actor = snapshot?.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'admin') {
    fail(
      'permission-denied',
      'No tienes permisos para administrar inventario de cabina'
    );
  }
};

// Verifica un insumo vigente y su revisión
export const requireManagedCabinSupply = (snapshot, expectedRevision) => {
  if (!snapshot?.exists) {
    fail('not-found', 'El insumo ya no existe');
  }
  const data = snapshot.data();
  const validUnit = Object.hasOwn(CABIN_UNIT_SCALES, data.unidad);
  if (
    data.schemaVersion !== 1
    || typeof data.nombre !== 'string'
    || !data.nombre.trim()
    || typeof data.marca !== 'string'
    || typeof data.categoria !== 'string'
    || !data.categoria.trim()
    || typeof data.descripcion !== 'string'
    || typeof data.activo !== 'boolean'
    || !validUnit
    || data.factorEscala !== CABIN_UNIT_SCALES[data.unidad]
    || data.sucursalId !== CABIN_BRANCH_ID
    || !isScaledQuantity(data.existenciasEscaladas)
    || !isScaledQuantity(data.stockMinimoEscalado)
    || !Number.isSafeInteger(data.revision)
    || data.revision < 1
  ) {
    fail('failed-precondition', 'El insumo contiene datos incompatibles');
  }
  if (data.revision !== expectedRevision) {
    fail(
      'aborted',
      'El insumo cambió mientras lo editabas actualiza los datos e inténtalo otra vez'
    );
  }
  return {
    id: snapshot.id,
    data,
    name: data.nombre.trim(),
    revision: data.revision,
    stockScaled: data.existenciasEscaladas,
    unit: data.unidad
  };
};

// Obtiene el valor privado del inventario
export const readCabinInventoryValue = (snapshot, supplyId) => {
  if (!snapshot?.exists) {
    fail('failed-precondition', 'El costo privado del insumo no existe');
  }
  const data = snapshot.data();
  if (
    data.schemaVersion !== 1
    || data.insumoId !== supplyId
    || data.sucursalId !== CABIN_BRANCH_ID
    || !isInventoryValue(data.valorInventarioCentavos)
  ) {
    fail('failed-precondition', 'El costo privado contiene datos incompatibles');
  }
  return data.valorInventarioCentavos;
};

// Devuelve una operación ya aplicada
export const mapExistingCabinOperation = ({
  snapshot,
  actorUid,
  supplyId,
  requestHash
}) => {
  if (!snapshot?.exists) {
    return null;
  }
  const data = snapshot.data();
  if (
    data.insumoId !== supplyId
    || data.actorUid !== actorUid
    || data.idempotencia?.hashSolicitud !== requestHash
    || !data.resultado
  ) {
    fail('already-exists', 'La clave de operación ya fue utilizada');
  }
  return { ...data.resultado, alreadyProcessed: true };
};

// Verifica que un alta no sobrescriba documentos
export const requireAvailableCabinSupplyCreation = ({
  supplySnapshot,
  costSnapshot
}) => {
  if (supplySnapshot.exists || costSnapshot.exists) {
    fail('already-exists', 'El identificador del insumo ya está en uso');
  }
};
