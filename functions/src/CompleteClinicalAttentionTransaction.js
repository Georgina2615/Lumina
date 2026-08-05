import { FieldValue } from 'firebase-admin/firestore';
import {
  buildClinicalCompletionEvent,
  buildClinicalCompletionResponse,
  buildClinicalCompletionUpdate
} from './ClinicalCompletionDocuments.js';
import {
  requireClinicalCompletionActor,
  requireClinicalCompletionAppointment,
  requireClinicalCompletionRetry,
  requireClinicalCompletionSlot,
  requireCompletedClinicalDocuments
} from './ClinicalCompletionStoredPolicy.js';

// Termina la atención clínica de manera atómica
export const runCompleteClinicalAttentionTransaction = ({
  actorUid,
  firestore,
  request,
  serverTimestamp = FieldValue.serverTimestamp
}) => firestore.runTransaction(async (transaction) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const appointmentReference = firestore.collection('citas').doc(request.appointmentId);
  const eventReference = appointmentReference.collection('eventos').doc('por_cobrar');
  const [actorSnapshot, appointmentSnapshot] = await transaction.getAll(actorReference, appointmentReference);
  requireClinicalCompletionActor(actorSnapshot);
  const state = requireClinicalCompletionAppointment({ appointmentId: request.appointmentId, snapshot: appointmentSnapshot });
  if (state.isRetry) {
    requireClinicalCompletionRetry({ actorUid, operationId: request.operationId, snapshot: await transaction.get(eventReference) });
    return buildClinicalCompletionResponse(request.appointmentId);
  }

  const clientId = state.appointment.clienteId;
  const references = {
    consent: firestore.collection('consentimientosClinicos').doc(request.appointmentId),
    consumption: firestore.collection('consumosCabina').doc(request.appointmentId),
    recommendation: firestore.collection('recomendacionesCuidado').doc(request.appointmentId),
    record: firestore.collection('expedientesClinicos').doc(clientId),
    session: firestore.collection('sesionesClinicas').doc(request.appointmentId),
    slot: firestore.collection('cupos').doc(state.appointment.cupoId)
  };
  const snapshots = await transaction.getAll(...Object.values(references));
  const [consentSnapshot, consumptionSnapshot, recommendationSnapshot, recordSnapshot, sessionSnapshot, slotSnapshot] = snapshots;
  requireClinicalCompletionSlot({ appointmentId: request.appointmentId, snapshot: slotSnapshot });
  const documents = requireCompletedClinicalDocuments({
    appointmentId: request.appointmentId,
    clientId,
    consentSnapshot,
    consumptionSnapshot,
    recommendationSnapshot,
    recordSnapshot,
    sessionSnapshot
  });
  const timestamp = serverTimestamp();
  transaction.update(appointmentReference, buildClinicalCompletionUpdate({ actorUid, documents, timestamp }));
  transaction.create(eventReference, buildClinicalCompletionEvent({ actorUid, operationId: request.operationId, timestamp }));
  return buildClinicalCompletionResponse(request.appointmentId);
});
