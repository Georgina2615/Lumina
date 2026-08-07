import { SkinTestConfigError } from './SkinTestConfigPolicy.js';

// Detiene una operación conocida
const fail = (code, message) => {
  throw new SkinTestConfigError(code, message);
};

// Exige una administradora activa
export const requireSkinTestAdmin = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'admin') {
    fail('permission-denied', 'No tienes permisos para configurar el test');
  }
};

// Comprueba la revisión guardada
export const requireSkinTestRevision = (snapshot, expectedRevision) => {
  const storedRevision = snapshot.exists
    && Number.isSafeInteger(snapshot.data().revision)
    ? snapshot.data().revision
    : 0;
  if (storedRevision !== expectedRevision) {
    fail('aborted', 'El test cambió y necesita actualizarse');
  }
  return snapshot.exists ? snapshot.data() : null;
};

// Valida los catálogos relacionados
export const requireSkinTestCatalog = ({ request, services, products }) => {
  const serviceById = new Map(services.map((snapshot) => [snapshot.id, snapshot]));
  const productById = new Map(products.map((snapshot) => [snapshot.id, snapshot]));
  Object.values(request.results).forEach((result) => {
    if (result.serviceId) {
      const service = serviceById.get(result.serviceId);
      if (!service?.exists || service.data().activo !== true) {
        fail('failed-precondition', 'Una recomendación usa un servicio no disponible');
      }
    }
    result.productIds.forEach((productId) => {
      const product = productById.get(productId);
      if (!product?.exists || product.data().activo !== true) {
        fail('failed-precondition', 'Una recomendación usa un producto no disponible');
      }
    });
  });
};

// Reconoce un reintento idéntico
export const mapExistingSkinTestOperation = ({ actorUid, hash, snapshot }) => {
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (
    data.actorUid !== actorUid
    || data.hashSolicitud !== hash
    || !data.resultado
  ) {
    fail('already-exists', 'La operación ya fue utilizada');
  }
  return { ...data.resultado, alreadyProcessed: true };
};
