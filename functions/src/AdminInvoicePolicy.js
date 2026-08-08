import { HttpsError } from 'firebase-functions/v2/https';

const invoiceIdPattern = /^[A-Za-z0-9_-]{1,150}$/;
const allowedActions = new Set(['prepare', 'deliver']);
const allowedStatuses = new Set(['pendiente', 'preparada', 'entregada']);

// Exige una administradora activa
export const requireInvoiceAdmin = (snapshot) => {
  const actor = snapshot?.exists ? snapshot.data() : null;
  if (actor?.activo !== true || actor?.rol !== 'admin') {
    throw new HttpsError('permission-denied', 'Tu cuenta no puede administrar facturas');
  }
};

// Valida la acción enviada desde administración
export const validateAdminInvoiceRequest = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data)
    ? data
    : {};
  const invoiceId = typeof source.invoiceId === 'string'
    ? source.invoiceId.trim()
    : '';
  const action = typeof source.action === 'string' ? source.action.trim() : '';
  const fiscalFolio = typeof source.fiscalFolio === 'string'
    ? source.fiscalFolio.trim()
    : '';
  const note = typeof source.note === 'string' ? source.note.trim() : '';
  const expectedRevision = Number(source.expectedRevision);

  if (!invoiceIdPattern.test(invoiceId) || !allowedActions.has(action)) {
    throw new HttpsError('invalid-argument', 'Revisa la solicitud seleccionada');
  }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new HttpsError('invalid-argument', 'Actualiza la solicitud antes de continuar');
  }
  if (action === 'prepare' && (fiscalFolio.length < 3 || fiscalFolio.length > 100)) {
    throw new HttpsError('invalid-argument', 'Escribe el folio o referencia de la factura');
  }
  if (note.length > 300) {
    throw new HttpsError('invalid-argument', 'La nota es demasiado larga');
  }

  return { action, expectedRevision, fiscalFolio, invoiceId, note };
};

// Exige una solicitud guardada y vigente
export const requireStoredAdminInvoice = (snapshot, request) => {
  const invoice = snapshot?.exists ? snapshot.data() : null;
  if (
    invoice?.schemaVersion !== 1
    || !allowedStatuses.has(invoice.estado)
    || !Number.isSafeInteger(invoice.revision)
  ) {
    throw new HttpsError('not-found', 'La solicitud ya no está disponible');
  }
  if (invoice.revision !== request.expectedRevision) {
    throw new HttpsError('failed-precondition', 'La solicitud cambió Actualiza la pantalla');
  }
  return invoice;
};

// Comprueba el orden permitido del proceso
export const getNextInvoiceStatus = (currentStatus, action) => {
  if (action === 'prepare' && currentStatus === 'pendiente') return 'preparada';
  if (action === 'deliver' && currentStatus === 'preparada') return 'entregada';
  throw new HttpsError('failed-precondition', 'Ese cambio ya no está disponible');
};
