import { RetailInventoryError } from './RetailInventoryError.js';

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new RetailInventoryError(code, message);
};

// Reconoce enteros monetarios positivos
const isPositiveMoney = (value) => (
  Number.isSafeInteger(value) && value > 0 && value <= 100_000_000
);

// Verifica que el actor sea administrador activo
export const requireRetailAdmin = (snapshot) => {
  const actor = snapshot?.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'admin') {
    fail('permission-denied', 'No tienes permisos para administrar inventario');
  }
};

// Verifica un producto vigente y su revisión
export const requireManagedRetailProduct = (snapshot, expectedRevision) => {
  if (!snapshot?.exists) {
    fail('not-found', 'El producto ya no existe');
  }
  const data = snapshot.data();
  const revision = Number.isSafeInteger(data.revision) && data.revision >= 0
    ? data.revision
    : 0;
  if (
    data.schemaVersion !== 1
    || typeof data.nombre !== 'string'
    || !data.nombre.trim()
    || !isPositiveMoney(data.precioCentavos)
    || !Number.isSafeInteger(data.existencias)
    || data.existencias < 0
    || !Number.isSafeInteger(data.stockMinimo)
    || data.stockMinimo < 0
  ) {
    fail('failed-precondition', 'El producto contiene datos incompatibles');
  }
  if (revision !== expectedRevision) {
    fail(
      'aborted',
      'El producto cambió mientras lo editabas actualiza los datos e inténtalo otra vez'
    );
  }
  return {
    id: snapshot.id,
    data,
    revision,
    name: data.nombre.trim(),
    stock: data.existencias
  };
};

// Verifica un costo privado cuando existe
export const readPrivateProductCost = (snapshot, productId) => {
  if (!snapshot?.exists) {
    return null;
  }
  const data = snapshot.data();
  if (
    data.schemaVersion !== 1
    || data.productoId !== productId
    || !isPositiveMoney(data.costoPromedioCentavos)
  ) {
    fail('failed-precondition', 'El costo privado contiene datos incompatibles');
  }
  return data.costoPromedioCentavos;
};

// Devuelve una operación ya aplicada
export const mapExistingRetailOperation = ({
  snapshot,
  actorUid,
  productId,
  requestHash
}) => {
  if (!snapshot?.exists) {
    return null;
  }
  const data = snapshot.data();
  if (
    data.productoId !== productId
    || data.actorUid !== actorUid
    || data.idempotencia?.hashSolicitud !== requestHash
    || !data.resultado
  ) {
    fail('already-exists', 'La clave de operación ya fue utilizada');
  }
  return { ...data.resultado, alreadyProcessed: true };
};

// Verifica que un alta no sobrescriba documentos
export const requireAvailableProductCreation = ({
  productSnapshot,
  costSnapshot
}) => {
  if (productSnapshot.exists || costSnapshot.exists) {
    fail('already-exists', 'El identificador del producto ya está en uso');
  }
};
