// Construye el documento público administrado
export const buildSkinTestConfigDocument = ({ actorUid, request, timestamp }) => ({
  activo: request.active,
  actualizadoEn: timestamp,
  actualizadoPor: actorUid,
  preguntas: request.questions,
  recomendaciones: request.results,
  revision: request.expectedRevision + 1,
  schemaVersion: 1
});

// Construye el historial privado del cambio
export const buildSkinTestConfigChange = ({
  actorUid,
  hash,
  previous,
  request,
  response,
  timestamp
}) => ({
  actorUid,
  anterior: previous,
  creadoEn: timestamp,
  hashSolicitud: hash,
  nuevo: buildSkinTestConfigDocument({ actorUid, request, timestamp }),
  resultado: response
});
