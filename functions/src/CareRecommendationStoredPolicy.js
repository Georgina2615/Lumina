import { CareRecommendationError } from './CareRecommendationError.js';

// Detiene una operación incompatible
const fail = (code, message) => {
  throw new CareRecommendationError(code, message);
};

// Exige una cosmetóloga activa
export const requireCareRecommendationActor = (snapshot) => {
  const actor = snapshot.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'cosmetologa') {
    fail('permission-denied', 'Tu cuenta no puede guardar recomendaciones');
  }
};

// Exige la cita activa de la misma clienta
export const requireCareRecommendationAppointment = ({ appointmentId, clientId, snapshot }) => {
  const appointment = snapshot.exists ? snapshot.data() : null;
  if (
    !appointment
    || snapshot.id !== appointmentId
    || appointment.clienteId !== clientId
    || appointment.estado !== 'en_cabina'
  ) fail('failed-precondition', 'La cita debe estar en cabina para guardar recomendaciones');
  return appointment;
};

// Exige una clienta y seguimiento vigentes
export const requireCareRecommendationClinicalWork = ({ clientId, sessionSnapshot, clientSnapshot }) => {
  const client = clientSnapshot.exists ? clientSnapshot.data() : null;
  const session = sessionSnapshot.exists ? sessionSnapshot.data() : null;
  if (!client || clientSnapshot.id !== clientId || client.fusionado === true) {
    fail('not-found', 'La clienta ya no está disponible');
  }
  if (session?.clientId !== clientId || session?.status !== 'completed') {
    fail('failed-precondition', 'Completa el seguimiento antes de guardar recomendaciones');
  }
};

// Recupera un reintento y valida la revisión
export const requireStoredCareRecommendation = ({ operationId, requestHash, expectedRevision, snapshot }) => {
  if (!snapshot.exists) {
    if (expectedRevision !== 0) fail('aborted', 'La recomendación cambió vuelve a cargarla');
    return { existingResult: null, stored: null };
  }
  const stored = snapshot.data();
  if (stored.lastOperation?.id === operationId && stored.lastOperation?.requestHash === requestHash) {
    return { existingResult: stored.lastOperation.result, stored };
  }
  if (stored.revision !== expectedRevision) {
    fail('aborted', 'La recomendación cambió vuelve a cargarla');
  }
  return { existingResult: null, stored };
};

// Exige un producto disponible en el catálogo
export const requireRecommendedProduct = (snapshot, productId) => {
  const product = snapshot.exists ? snapshot.data() : null;
  if (!product || snapshot.id !== productId || product.activo !== true) {
    fail('failed-precondition', 'Uno de los productos ya no está disponible');
  }
  return {
    brand: String(product.marca ?? ''),
    id: productId,
    imageUrl: String(product.imagenUrl ?? ''),
    name: String(product.nombre ?? ''),
    priceCents: Number.isSafeInteger(product.precioCentavos) ? product.precioCentavos : 0
  };
};

// Exige un servicio disponible en el catálogo
export const requireRecommendedService = (snapshot, serviceId) => {
  if (!serviceId) return null;
  const service = snapshot?.exists ? snapshot.data() : null;
  if (!service || snapshot.id !== serviceId || service.activo !== true) {
    fail('failed-precondition', 'El tratamiento sugerido ya no está disponible');
  }
  return {
    id: serviceId,
    name: String(service.nombre ?? ''),
    priceCents: Number.isSafeInteger(service.precioCentavos) ? service.precioCentavos : 0
  };
};
