import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { SaleError } from './SaleError.js';
import {
  requireTicketRetryAvailability
} from './SaleTicketRetryPolicy.js';
import { requireAuthorizedActor } from './StoredAppointmentPolicy.js';

// Define el formato permitido para ventas
const SALE_ID_PATTERN = /^[A-Za-z0-9_-]{1,250}$/;

// Define las resoluciones permitidas
const RESOLUTION_ACTIONS = new Set(['confirmed', 'retry']);

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Valida la solicitud de resolución
const validateResolutionRequest = (data) => {
  // Detiene contratos que no son objetos
  if (!isRecord(data)) {
    throw new HttpsError(
      'invalid-argument',
      'La solicitud de resolución no es válida'
    );
  }

  // Define las propiedades permitidas
  const allowedKeys = new Set(['saleId', 'action']);

  // Detiene propiedades fuera del contrato
  if (Object.keys(data).some((key) => !allowedKeys.has(key))) {
    throw new HttpsError(
      'invalid-argument',
      'La solicitud de resolución contiene campos no permitidos'
    );
  }

  // Detiene identificadores inseguros
  if (
    typeof data.saleId !== 'string'
    || !SALE_ID_PATTERN.test(data.saleId)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'La venta de la resolución no es válida'
    );
  }

  // Detiene acciones desconocidas
  if (!RESOLUTION_ACTIONS.has(data.action)) {
    throw new HttpsError(
      'invalid-argument',
      'La acción de resolución no es válida'
    );
  }

  // Devuelve el contrato comprobado
  return {
    action: data.action,
    saleId: data.saleId
  };
};

// Convierte errores conocidos al contrato remoto
const mapResolutionError = (error) => {
  // Conserva errores remotos ya normalizados
  if (error instanceof HttpsError) {
    // Devuelve el error remoto existente
    return error;
  }

  // Convierte rechazos de permisos del dominio
  if (error instanceof SaleError) {
    // Devuelve un error remoto seguro
    return new HttpsError(error.code, error.message);
  }

  // Oculta detalles inesperados
  return new HttpsError(
    'internal',
    'No se pudo resolver el estado del ticket'
  );
};

// Construye el cierre confirmado manualmente
const buildConfirmedTicket = ({
  actorUid,
  ticket,
  timestamp
}) => ({
  ...ticket,
  estado: 'enviado',
  intentoId: null,
  enviadoEn: timestamp,
  resolucionManual: 'confirmado',
  resolucionManualEn: timestamp,
  resolucionManualPor: actorUid,
  ultimoError: ''
});

// Construye el reintento autorizado manualmente
const buildRetryTicket = ({
  actorUid,
  ticket,
  timestamp
}) => ({
  ...ticket,
  estado: 'pendiente',
  intentoId: null,
  enviadoEn: null,
  reintentoSolicitadoEn: timestamp,
  reintentoSolicitadoPor: actorUid,
  resolucionManual: 'reintento',
  resolucionManualEn: timestamp,
  resolucionManualPor: actorUid,
  ultimoError: ''
});

// Resuelve una entrega ambigua con decisión humana
export const resolveUnconfirmedSaleTicketHandler = async ({
  auth,
  data,
  firestore,
  now = () => Date.now(),
  serverTimestamp = () => FieldValue.serverTimestamp()
}) => {
  // Detiene solicitudes sin identidad
  if (!auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'Inicia sesión para resolver el ticket'
    );
  }

  try {
    // Valida la resolución solicitada
    const request = validateResolutionRequest(data);

    // Identifica al actor vigente
    const actorReference = firestore.collection('usuarios').doc(auth.uid);

    // Identifica la venta solicitada
    const saleReference = firestore
      .collection('ventas')
      .doc(request.saleId);

    // Ejecuta la resolución como una sola operación
    return await firestore.runTransaction(async (transaction) => {
      // Lee permisos y ticket dentro de la misma operación
      const [actorSnapshot, saleSnapshot] = await transaction.getAll(
        actorReference,
        saleReference
      );

      requireAuthorizedActor(actorSnapshot);

      // Detiene ventas que ya no existen
      if (!saleSnapshot.exists) {
        throw new HttpsError('not-found', 'La venta ya no existe');
      }

      // Obtiene el estado vigente
      const sale = saleSnapshot.data();

      // Permite resolver solo entregas ambiguas
      if (sale.ticket?.estado !== 'no_confirmado') {
        throw new HttpsError(
          'failed-precondition',
          'El ticket ya no requiere resolución manual'
        );
      }

      // Verifica límites antes de autorizar otro envío
      if (request.action === 'retry') {
        requireTicketRetryAvailability({
          nowMillis: now(),
          ticket: sale.ticket
        });
      }

      // Crea una única marca temporal auditable
      const timestamp = serverTimestamp();

      // Construye el estado solicitado
      const ticket = request.action === 'confirmed'
        ? buildConfirmedTicket({
          actorUid: auth.uid,
          ticket: sale.ticket,
          timestamp
        })
        : buildRetryTicket({
          actorUid: auth.uid,
          ticket: sale.ticket,
          timestamp
        });

      // Persiste únicamente el estado del ticket
      transaction.update(saleReference, { ticket });

      // Obtiene el estado público resultante
      const ticketStatus = request.action === 'confirmed'
        ? 'enviado'
        : 'pendiente';

      // Devuelve el resultado de la resolución
      return {
        action: request.action,
        saleId: request.saleId,
        ticketStatus,
        sent: request.action === 'confirmed'
      };
    });
  } catch (error) {
    throw mapResolutionError(error);
  }
};
