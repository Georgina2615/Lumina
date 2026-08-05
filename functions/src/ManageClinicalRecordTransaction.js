import { FieldValue } from 'firebase-admin/firestore';
import {
  buildClinicalRecordDocument,
  buildClinicalRecordResponse
} from './ClinicalRecordDocuments.js';
import {
  getExistingClinicalOperation,
  requireActiveClinicalAppointment,
  requireClinicalActor,
  requireClinicalClient,
  requireClinicalRecordStatusTransition,
  requireStoredClinicalRecord
} from './ClinicalRecordStoredPolicy.js';

// Guarda una ficha clínica dentro de una transacción
export const runManageClinicalRecordTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const appointmentReference = firestore.collection('citas').doc(request.appointmentId);
  const clientReference = firestore.collection('clientes').doc(request.clientId);
  const recordReference = firestore.collection('expedientesClinicos').doc(request.clientId);

  return firestore.runTransaction(async (transaction) => {
    const [actorSnapshot, appointmentSnapshot, clientSnapshot, recordSnapshot] = await transaction.getAll(
      actorReference,
      appointmentReference,
      clientReference,
      recordReference
    );

    requireClinicalActor(actorSnapshot);
    requireClinicalClient(clientSnapshot, request.clientId);
    requireActiveClinicalAppointment({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      snapshot: appointmentSnapshot
    });

    const storedRecord = requireStoredClinicalRecord({
      clientId: request.clientId,
      expectedRevision: request.expectedRevision,
      snapshot: recordSnapshot
    });
    requireClinicalRecordStatusTransition(storedRecord, request.status);
    const existingResult = getExistingClinicalOperation({
      operationId: request.operationId,
      requestHash,
      storedRecord
    });

    if (existingResult) return existingResult;

    const response = buildClinicalRecordResponse({
      clientId: request.clientId,
      revision: (storedRecord?.revision ?? 0) + 1,
      status: request.status
    });
    const document = buildClinicalRecordDocument({
      actorUid,
      request,
      requestHash,
      response,
      storedRecord,
      timestamp: serverTimestamp()
    });

    if (recordSnapshot.exists) {
      transaction.set(recordReference, document);
    } else {
      transaction.create(recordReference, document);
    }

    return response;
  });
};
