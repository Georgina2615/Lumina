// Construye la respuesta estable del cierre
export const buildClinicalCompletionResponse = (appointmentId) => ({
  appointmentId,
  status: 'por_cobrar'
});

// Construye el resumen verificado para recepción
export const buildClinicalCompletionUpdate = ({ actorUid, documents, timestamp }) => ({
  actualizadaEn: timestamp,
  actualizadaPor: actorUid,
  atencionClinica: {
    consumoRegistrado: true,
    expedienteRevision: documents.record.revision,
    finalizadaEn: timestamp,
    finalizadaPor: actorUid,
    recomendacionRevision: documents.recommendation.revision,
    seguimientoRevision: documents.session.revision
  },
  estado: 'por_cobrar'
});

// Construye el evento inmutable del cierre
export const buildClinicalCompletionEvent = ({ actorUid, operationId, timestamp }) => ({
  accion: 'finalizar_atencion',
  actorUid,
  anticipoResultado: null,
  estadoAnterior: 'en_cabina',
  estadoNuevo: 'por_cobrar',
  fecha: timestamp,
  motivo: null,
  operationId,
  tipo: 'cambio_estado'
});
