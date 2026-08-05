// Construye la respuesta estable del seguimiento
export const buildClinicalSessionResponse = ({ appointmentId, revision, status }) => ({
  appointmentId,
  revision,
  status
});

// Construye un seguimiento clínico completo
export const buildClinicalSessionDocument = ({
  actorUid,
  appointment,
  previousSession,
  request,
  requestHash,
  response,
  storedSession,
  timestamp
}) => ({
  appointmentId: request.appointmentId,
  clientId: request.clientId,
  appointmentDate: storedSession?.appointmentDate ?? appointment.fecha,
  scheduledTime: storedSession?.scheduledTime ?? appointment.hora,
  scheduledTreatment: storedSession?.scheduledTreatment ?? appointment.servicio,
  previousSessionId: storedSession?.previousSessionId ?? previousSession?.id ?? '',
  previousTreatment: storedSession?.previousTreatment
    ?? previousSession?.performedTreatment
    ?? '',
  beforeObservations: request.session.beforeObservations,
  performedTreatment: request.session.performedTreatment,
  afterObservations: request.session.afterObservations,
  photoConsentGranted: request.session.photoConsentGranted,
  photos: request.session.photos,
  status: request.status,
  revision: response.revision,
  createdAt: storedSession?.createdAt ?? timestamp,
  createdBy: storedSession?.createdBy ?? actorUid,
  updatedAt: timestamp,
  updatedBy: actorUid,
  completedAt: request.status === 'completed'
    ? storedSession?.completedAt ?? timestamp
    : null,
  completedBy: request.status === 'completed'
    ? storedSession?.completedBy ?? actorUid
    : '',
  lastOperation: {
    id: request.operationId,
    requestHash,
    result: response
  },
  schemaVersion: 1
});
