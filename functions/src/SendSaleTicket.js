import { FieldValue } from 'firebase-admin/firestore';
import { EmailJsTransportError } from './EmailJsTransport.js';
import {
  claimSaleTicket,
  completeSaleTicket
} from './SaleTicketState.js';
import { buildTicketTemplateParameters } from './TicketTemplate.js';

// Construye un error persistente sin detalles sensibles
const mapSafeFailure = (error) => {
  // Conserva códigos saneados del transporte
  if (error instanceof EmailJsTransportError) {
    // Define mensajes operativos por tipo
    const messages = {
      authorization: 'Revisa la autorización del servicio de correo',
      configuration: 'Revisa la configuración del servicio de correo',
      network: 'No fue posible conectar con el servicio de correo',
      provider: 'El servicio de correo no pudo completar el envío',
      rate_limit: 'El servicio de correo alcanzó su límite temporal',
      timeout: 'El servicio de correo tardó demasiado en responder'
    };

    // Devuelve un fallo reconocido
    return {
      code: error.code,
      deliveryUnknown: ['network', 'provider', 'timeout'].includes(error.code),
      message: messages[error.code] ?? messages.provider
    };
  }

  // Oculta errores de datos o ejecución
  return {
    code: 'ticket_data',
    deliveryUnknown: false,
    message: 'No fue posible preparar el ticket digital'
  };
};

// Valida la identidad interna de un intento
const requireAttempt = ({ attemptId, saleId }) => {
  // Detiene identificadores internos inseguros
  if (
    typeof saleId !== 'string'
    || !saleId
    || saleId.length > 250
    || typeof attemptId !== 'string'
    || !attemptId
    || attemptId.length > 250
  ) {
    throw new Error('El intento del ticket no es válido');
  }
};

// Marca una entrega que no debe repetirse
const markUnconfirmedDelivery = async ({
  attemptId,
  firestore,
  saleId,
  serverTimestamp
}) => {
  // Persiste una advertencia que bloquea reenvíos ciegos
  return completeSaleTicket({
    attemptId,
    errorMessage: 'Revisa EmailJS antes de intentar otro envío',
    firestore,
    saleId,
    serverTimestamp,
    status: 'no_confirmado'
  });
};

// Coordina el envío sin modificar la venta financiera
export const sendSaleTicketHandler = async ({
  attemptId,
  buildTemplate = buildTicketTemplateParameters,
  firestore,
  saleId,
  sendEmail,
  serverTimestamp = () => FieldValue.serverTimestamp()
}) => {
  requireAttempt({ attemptId, saleId });

  // Reclama el único estado permitido
  const claim = await claimSaleTicket({
    attemptId,
    firestore,
    saleId,
    serverTimestamp
  });

  // Recupera una entrega ambigua sin repetirla
  if (claim.status === 'uncertain') {
    await markUnconfirmedDelivery({
      attemptId,
      firestore,
      saleId,
      serverTimestamp
    });

    // Devuelve el estado conservador
    return {
      outcome: 'unconfirmed',
      saleId,
      ticketStatus: 'no_confirmado',
      sent: false
    };
  }

  // Devuelve resultados que no requieren proveedor
  if (claim.status !== 'claimed') {
    // Devuelve el estado sin exponer datos de venta
    return {
      outcome: claim.status,
      saleId,
      ticketStatus: claim.ticketStatus ?? claim.status,
      sent: false
    };
  }

  let templateParameters;
  try {
    // Construye variables desde la venta congelada
    templateParameters = buildTemplate(claim.sale);

    // Envía el ticket mediante la dependencia autorizada
    await sendEmail({ templateParameters });
  } catch (error) {
    // Convierte el fallo a información operativa
    const failure = mapSafeFailure(error);

    // Distingue rechazos seguros de entregas ambiguas
    const failureStatus = failure.deliveryUnknown
      ? 'no_confirmado'
      : 'fallido';

    // Conserva la venta y evita duplicados inciertos
    await completeSaleTicket({
      attemptId,
      errorMessage: failure.deliveryUnknown
        ? 'Revisa EmailJS antes de intentar otro envío'
        : failure.message,
      firestore,
      saleId,
      serverTimestamp,
      status: failureStatus
    });

    // Devuelve un fallo seguro sin lanzar reintentos
    return {
      outcome: failure.deliveryUnknown ? 'unconfirmed' : 'failed',
      saleId,
      ticketStatus: failureStatus,
      errorCode: failure.code,
      sent: false
    };
  }

  // Confirma el envío fuera del control del proveedor
  const completion = await completeSaleTicket({
    attemptId,
    firestore,
    saleId,
    serverTimestamp,
    status: 'enviado'
  });

  // Devuelve el resultado final persistido
  return {
    outcome: completion.applied ? 'sent' : 'stale',
    saleId,
    ticketStatus: completion.ticketStatus,
    sent: completion.ticketStatus === 'enviado'
  };
};
