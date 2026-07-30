// Define los estados que ya no deben enviarse
const terminalStates = new Set([
  'enviado',
  'omitido',
  'no_confirmado'
]);

// Define los cierres permitidos para un intento
const completionStates = new Set([
  'enviado',
  'fallido',
  'no_confirmado'
]);

// Normaliza el contador persistido
const getPreviousAttempts = (ticket) => (
  Number.isSafeInteger(ticket.intentos) && ticket.intentos >= 0
    ? ticket.intentos
    : 0
);

// Identifica la venta canónica
const getSaleReference = (firestore, saleId) => (
  firestore.collection('ventas').doc(saleId)
);

// Reclama un ticket antes de contactar al proveedor
export const claimSaleTicket = async ({
  attemptId,
  firestore,
  saleId,
  serverTimestamp
}) => {
  // Identifica el documento protegido
  const saleReference = getSaleReference(firestore, saleId);

  // Ejecuta una reclamación exclusiva
  return firestore.runTransaction(async (transaction) => {
    // Lee el estado vigente
    const snapshot = await transaction.get(saleReference);

    // Detiene ventas inexistentes
    if (!snapshot.exists) {
      // Devuelve un resultado seguro
      return { status: 'missing' };
    }

    // Obtiene la venta persistida
    const sale = snapshot.data();

    // Obtiene el estado actual del ticket
    const ticket = sale.ticket ?? {};

    // Limpia el destinatario persistido
    const recipientEmail = typeof sale.clienteEmail === 'string'
      ? sale.clienteEmail.trim()
      : '';

    // Omite comprobantes sin destinatario
    if (!recipientEmail) {
      // Evita escrituras repetidas en estados terminales
      if (!terminalStates.has(ticket.estado)) {
        transaction.update(saleReference, {
          ticket: {
            ...ticket,
            estado: 'omitido',
            intentoId: null,
            ultimoIntentoEn: serverTimestamp(),
            enviadoEn: null,
            ultimoError: ''
          }
        });
      }

      // Devuelve la omisión confirmada
      return { status: 'omitido' };
    }

    // Detecta una entrega anterior sin cierre confirmado
    if (
      ticket.estado === 'enviando'
      && ticket.intentoId === attemptId
    ) {
      // Evita repetir una solicitud ambigua
      return { status: 'uncertain' };
    }

    // Protege reenvíos y carreras
    if (ticket.estado !== 'pendiente') {
      // Devuelve el estado que ganó la carrera
      return {
        status: 'skipped',
        ticketStatus: ticket.estado ?? 'desconocido'
      };
    }

    // Marca el envío en curso
    transaction.update(saleReference, {
      ticket: {
        ...ticket,
        estado: 'enviando',
        intentos: getPreviousAttempts(ticket) + 1,
        intentoId: attemptId,
        ultimoIntentoEn: serverTimestamp(),
        enviadoEn: null,
        ultimoError: ''
      }
    });

    // Devuelve la copia reclamada
    return { status: 'claimed', sale };
  });
};

// Finaliza solo el intento que conserva la reclamación
export const completeSaleTicket = async ({
  attemptId,
  errorMessage = '',
  firestore,
  saleId,
  serverTimestamp,
  status
}) => {
  // Detiene estados de cierre desconocidos
  if (!completionStates.has(status)) {
    throw new Error('El cierre del ticket no es válido');
  }

  // Identifica la venta reclamada
  const saleReference = getSaleReference(firestore, saleId);

  // Protege la finalización contra carreras
  return firestore.runTransaction(async (transaction) => {
    // Lee la reclamación vigente
    const snapshot = await transaction.get(saleReference);

    // Detecta ventas eliminadas durante el envío
    if (!snapshot.exists) {
      // Devuelve una finalización descartada
      return { applied: false, ticketStatus: 'missing' };
    }

    // Obtiene el ticket vigente
    const ticket = snapshot.data().ticket ?? {};

    // Descarta resultados de intentos anteriores
    if (
      ticket.estado !== 'enviando'
      || ticket.intentoId !== attemptId
    ) {
      // Devuelve el estado que ya fue persistido
      return {
        applied: false,
        ticketStatus: ticket.estado ?? 'desconocido'
      };
    }

    // Actualiza el estado terminal del intento
    transaction.update(saleReference, {
      ticket: {
        ...ticket,
        estado: status,
        intentoId: null,
        enviadoEn: status === 'enviado' ? serverTimestamp() : null,
        ultimoError: errorMessage
      }
    });

    // Confirma la finalización aplicada
    return { applied: true, ticketStatus: status };
  });
};
