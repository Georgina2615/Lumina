// Construye la respuesta estable de la ficha
export const buildClinicalRecordResponse = ({ clientId, revision, status }) => ({
  clientId,
  revision,
  status
});

// Construye el documento completo del expediente
export const buildClinicalRecordDocument = ({
  actorUid,
  request,
  requestHash,
  response,
  storedRecord,
  timestamp
}) => ({
  clientId: request.clientId,
  personalDetails: request.record.personalDetails,
  history: request.record.history,
  precautions: request.record.precautions,
  skinAnalysis: request.record.skinAnalysis,
  status: request.status,
  revision: response.revision,
  createdAt: storedRecord?.createdAt ?? timestamp,
  createdBy: storedRecord?.createdBy ?? actorUid,
  updatedAt: timestamp,
  updatedBy: actorUid,
  lastAppointmentId: request.appointmentId,
  lastOperation: {
    id: request.operationId,
    requestHash,
    result: response
  },
  schemaVersion: 1
});
