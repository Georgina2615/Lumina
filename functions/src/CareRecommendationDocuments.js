// Construye la respuesta estable de una recomendación
export const buildCareRecommendationResponse = ({ appointmentId, productCount, revision }) => ({
  appointmentId,
  productCount,
  revision,
  status: 'saved'
});

// Construye el historial visible de una atención
export const buildCareRecommendationDocument = ({
  actorUid,
  appointment,
  products,
  recommendedService,
  request,
  requestHash,
  response,
  stored,
  timestamp
}) => ({
  appointmentDate: String(appointment.fecha ?? ''),
  appointmentId: request.appointmentId,
  careInstructions: request.recommendation.careInstructions,
  clientId: request.clientId,
  createdAt: stored?.createdAt ?? timestamp,
  createdBy: stored?.createdBy ?? actorUid,
  lastOperation: {
    id: request.operationId,
    requestHash,
    result: response
  },
  nextVisitDate: request.recommendation.nextVisitDate,
  products,
  recommendedService,
  revision: response.revision,
  schemaVersion: 1,
  serviceName: String(appointment.servicio ?? ''),
  status: 'saved',
  updatedAt: timestamp,
  updatedBy: actorUid
});
