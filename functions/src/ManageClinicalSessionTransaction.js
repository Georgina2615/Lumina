import { FieldValue } from 'firebase-admin/firestore';
import {
  buildClinicalSessionDocument,
  buildClinicalSessionResponse
} from './ClinicalSessionDocuments.js';
import {
  getExistingClinicalSessionOperation,
  requireClinicalRecordForSession,
  requireClinicalSessionActor,
  requireClinicalSessionAppointment,
  requireClinicalSessionClient,
  requireConsentForSession,
  requireClinicalSessionStatusTransition,
  requireStoredClinicalSession
} from './ClinicalSessionStoredPolicy.js';

// Guarda un seguimiento clínico dentro de una transacción
export const runManageClinicalSessionTransaction = async ({
  actorUid,
  firestore,
  previousSession,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const appointmentReference = firestore.collection('citas').doc(request.appointmentId);
  const clientReference = firestore.collection('clientes').doc(request.clientId);
  const recordReference = firestore.collection('expedientesClinicos').doc(request.clientId);
  const consentReference = firestore.collection('consentimientosClinicos').doc(request.appointmentId);
  const sessionReference = firestore.collection('sesionesClinicas').doc(request.appointmentId);

  return firestore.runTransaction(async (transaction) => {
    const snapshots = await transaction.getAll(
      actorReference,
      appointmentReference,
      clientReference,
      recordReference,
      consentReference,
      sessionReference
    );
    const [
      actorSnapshot,
      appointmentSnapshot,
      clientSnapshot,
      recordSnapshot,
      consentSnapshot,
      sessionSnapshot
    ] = snapshots;

    requireClinicalSessionActor(actorSnapshot);
    const appointment = requireClinicalSessionAppointment({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      snapshot: appointmentSnapshot
    });
    requireClinicalSessionClient(clientSnapshot, request.clientId);
    requireClinicalRecordForSession({
      clientId: request.clientId,
      sessionStatus: request.status,
      snapshot: recordSnapshot
    });
    requireConsentForSession({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      session: request.session,
      snapshot: consentSnapshot
    });
    const storedSession = requireStoredClinicalSession({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      expectedRevision: request.expectedRevision,
      snapshot: sessionSnapshot
    });
    requireClinicalSessionStatusTransition(storedSession, request.status);
    const existingResult = getExistingClinicalSessionOperation({
      operationId: request.operationId,
      requestHash,
      storedSession
    });

    if (existingResult) return existingResult;

    const response = buildClinicalSessionResponse({
      appointmentId: request.appointmentId,
      revision: (storedSession?.revision ?? 0) + 1,
      status: request.status
    });
    const document = buildClinicalSessionDocument({
      actorUid,
      appointment,
      previousSession,
      request,
      requestHash,
      response,
      storedSession,
      timestamp: serverTimestamp()
    });

    if (sessionSnapshot.exists) {
      transaction.set(sessionReference, document);
    } else {
      transaction.create(sessionReference, document);
    }

    return response;
  });
};
