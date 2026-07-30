import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { SaleError } from './SaleError.js';
import {
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

// Valida la solicitud mínima de reintento
const validateRetryRequest = (data) => {
  // Detiene contratos que no son objetos
  if (!isRecord(data)) {
    throw new HttpsError(
      'invalid-argument',
      'La solicitud de reintento no es válida'
    );
  }

  // Detiene propiedades fuera del contrato
  if (Object.keys(data).some((key) => key !== 'saleId')) {
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

  // Devuelve el identificador comprobado
  return data.saleId;
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
    const saleId = validateRetryRequest(data);

    // Identifica al actor vigente
    const actorReference = firestore.collection('usuarios').doc(auth.uid);

    // Identifica la venta solicitada
    const saleReference = firestore.collection('ventas').doc(saleId);

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
        saleId,
        ticketStatus: 'pendiente',
        sent: false
      };
    });
  } catch (error) {
    throw mapRetryError(error);
  }
};
