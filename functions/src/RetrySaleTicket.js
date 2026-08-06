import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { SaleError } from './SaleError.js';
import {
  MAX_TICKET_ATTEMPTS,
  requireTicketRetryAvailability
} from './SaleTicketRetryPolicy.js';
import { requireAuthorizedActor } from './StoredAppointmentPolicy.js';

// Define el formato permitido para ventas
const SALE_ID_PATTERN = /^[A-Za-z0-9_-]{1,250}$/;

// Reconoce objetos sin aceptar arreglos
const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

// Normaliza el motivo de una reactivación administrativa
const requireRestartReason = (value) => {
  // Limpia el texto recibido
  const reason = typeof value === 'string' ? value.trim() : '';

  // Detiene motivos vacíos o excesivos
  if (reason.length < 10 || reason.length > 300) {
    throw new HttpsError(
      'invalid-argument',
      'Explica por qué se habilitará nuevamente el comprobante'
    );
  }

  // Devuelve el motivo seguro
  return reason;
};

// Valida la solicitud mínima de reintento
const validateRetryRequest = (data) => {
  // Detiene contratos que no son objetos
  if (!isRecord(data)) {
    throw new HttpsError(
      'invalid-argument',
      'La solicitud de reintento no es válida'
    );
  }

  // Detecta una reactivación administrativa
  const restart = data.restart === true;

  // Define las propiedades exactas de cada acción
  const allowedKeys = restart
    ? new Set(['reason', 'restart', 'saleId'])
    : new Set(['saleId']);

  // Detiene propiedades fuera del contrato
  if (
    Object.keys(data).length !== allowedKeys.size
    || Object.keys(data).some((key) => !allowedKeys.has(key))
  ) {
    throw new HttpsError(
      'invalid-argument',
      'La solicitud de reintento contiene campos no permitidos'
    );
  }

  // Detiene identificadores inseguros
  if (
    typeof data.saleId !== 'string'
    || !SALE_ID_PATTERN.test(data.saleId)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'La venta del reintento no es válida'
    );
  }

  // Devuelve la solicitud comprobada
  return {
    reason: restart ? requireRestartReason(data.reason) : '',
    restart,
    saleId: data.saleId
  };
};

// Convierte errores conocidos al contrato remoto
const mapRetryError = (error) => {
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
    'No se pudo reintentar el ticket digital'
  );
};

// Reintenta únicamente tickets fallidos
export const retrySaleTicketHandler = async ({
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
      'Inicia sesión para reenviar el ticket'
    );
  }

  try {
    // Valida la venta solicitada
    const request = validateRetryRequest(data);

    // Identifica al actor vigente
    const actorReference = firestore.collection('usuarios').doc(auth.uid);

    // Identifica la venta solicitada
    const saleReference = firestore.collection('ventas').doc(request.saleId);

    // Solicita el reintento sin contactar al proveedor
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

      // Permite reintentar solo rechazos confirmados
      if (sale.ticket?.estado !== 'fallido') {
        throw new HttpsError(
          'failed-precondition',
          'El ticket ya no está disponible para reintento'
        );
      }

      // Reactiva solo comprobantes agotados por una administradora
      if (request.restart) {
        // Detiene cuentas ajenas a administración
        if (actorSnapshot.data().rol !== 'admin') {
          throw new HttpsError(
            'permission-denied',
            'Solo administración puede habilitar más intentos'
          );
        }

        // Detiene comprobantes que todavía conservan intentos
        if (
          !Number.isSafeInteger(sale.ticket.intentos)
          || sale.ticket.intentos < MAX_TICKET_ATTEMPTS
        ) {
          throw new HttpsError(
            'failed-precondition',
            'El comprobante todavía permite un reintento normal'
          );
        }

        // Calcula el número de reactivación vigente
        const restartNumber = Number.isSafeInteger(
          sale.ticket.reactivaciones
        )
          ? sale.ticket.reactivaciones + 1
          : 1;

        // Comparte una sola fecha entre venta y registro
        const timestamp = serverTimestamp();

        // Identifica el registro independiente de la decisión
        const eventReference = firestore
          .collection('eventosComprobantes')
          .doc(`${request.saleId}_reactivacion_${restartNumber}`);

        // Habilita un nuevo grupo de tres intentos
        transaction.update(saleReference, {
          ticket: {
            ...sale.ticket,
            estado: 'pendiente',
            intentos: 0,
            intentoId: null,
            reactivaciones: restartNumber,
            reactivadoEn: timestamp,
            reactivadoPor: auth.uid,
            ultimoError: ''
          }
        });

        // Conserva quién autorizó la reactivación y por qué
        transaction.create(eventReference, {
          actorUid: auth.uid,
          creadaEn: timestamp,
          intentosAnteriores: sale.ticket.intentos,
          motivo: request.reason,
          numero: restartNumber,
          saleId: request.saleId,
          schemaVersion: 1,
          tipo: 'reactivacion_envio'
        });

        // Devuelve el nuevo estado solicitado
        return {
          action: 'restart',
          saleId: request.saleId,
          ticketStatus: 'pendiente',
          sent: false
        };
      }

      // Verifica enfriamiento y máximo de intentos
      requireTicketRetryAvailability({
        nowMillis: now(),
        ticket: sale.ticket
      });

      // Conserva la auditoría del reintento solicitado
      transaction.update(saleReference, {
        ticket: {
          ...sale.ticket,
          estado: 'pendiente',
          intentoId: null,
          reintentoSolicitadoEn: serverTimestamp(),
          reintentoSolicitadoPor: auth.uid,
          ultimoError: ''
        }
      });

      // Devuelve únicamente el estado solicitado
      return {
        saleId: request.saleId,
        ticketStatus: 'pendiente',
        sent: false
      };
    });
  } catch (error) {
    throw mapRetryError(error);
  }
};
