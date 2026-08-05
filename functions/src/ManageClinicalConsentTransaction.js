import { FieldValue } from 'firebase-admin/firestore';
import {
  buildClinicalConsentTemplateDocument,
  clinicalConsentTemplate,
  clinicalConsentTemplateHash
} from './ClinicalConsentTemplate.js';
import { failClinicalConsent } from './ClinicalConsentPolicy.js';
import {
  requireAdultCompletedRecord,
  requireClinicalConsentActor,
  requireClinicalConsentAppointment,
  requireClinicalConsentClient
} from './ClinicalConsentStoredPolicy.js';

// Ejecuta la lectura o firma dentro de una transacción
export const runManageClinicalConsentTransaction = async ({
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
  const consentReference = firestore.collection('consentimientosClinicos').doc(request.appointmentId);
  const templateReference = firestore.collection('plantillasConsentimientoClinico').doc(clinicalConsentTemplate.id);

  return firestore.runTransaction(async (transaction) => {
    const [actorSnapshot, appointmentSnapshot, clientSnapshot, recordSnapshot, consentSnapshot, templateSnapshot] = await transaction.getAll(
      actorReference,
      appointmentReference,
      clientReference,
      recordReference,
      consentReference,
      templateReference
    );
    requireClinicalConsentActor(actorSnapshot);
    const appointment = requireClinicalConsentAppointment({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      snapshot: appointmentSnapshot
    });
    const client = requireClinicalConsentClient(clientSnapshot, request.clientId);
    const adult = requireAdultCompletedRecord({
      appointmentDate: appointment.fecha,
      clientId: request.clientId,
      snapshot: recordSnapshot
    });

    if (!templateSnapshot.exists) {
      transaction.create(templateReference, buildClinicalConsentTemplateDocument(serverTimestamp()));
    } else if (templateSnapshot.data().contentHash !== clinicalConsentTemplateHash) {
      failClinicalConsent('failed-precondition', 'La plantilla de consentimiento necesita revisión');
    }

    const storedConsent = consentSnapshot.exists ? consentSnapshot.data() : null;
    if (request.action === 'load') {
      return {
        appointment: {
          date: appointment.fecha,
          service: String(appointment.servicio ?? ''),
          time: String(appointment.hora ?? '')
        },
        client: { name: String(client.nombreCompleto ?? '') },
        consent: storedConsent ? {
          clinicalPhotosAllowed: storedConsent.clinicalPhotosAllowed,
          marketingPhotosAllowed: storedConsent.marketingPhotosAllowed,
          signedAt: storedConsent.signedAt,
          status: storedConsent.status
        } : null,
        template: {
          ...clinicalConsentTemplate,
          contentHash: clinicalConsentTemplateHash
        }
      };
    }

    if (storedConsent) {
      if (
        storedConsent.lastOperation?.id === request.operationId
        && storedConsent.lastOperation?.requestHash === requestHash
      ) return storedConsent.lastOperation.result;
      failClinicalConsent('already-exists', 'El consentimiento de esta cita ya fue firmado');
    }

    const response = { appointmentId: request.appointmentId, status: 'signed' };
    transaction.create(consentReference, {
      acceptedStatementIds: request.acceptedStatementIds,
      ageAtAppointment: adult.age,
      appointmentDate: appointment.fecha,
      appointmentId: request.appointmentId,
      birthDateSnapshot: adult.birthDate,
      clientId: request.clientId,
      clientNameSnapshot: String(client.nombreCompleto ?? ''),
      clinicalPhotosAllowed: request.clinicalPhotosAllowed,
      lastOperation: { id: request.operationId, requestHash, result: response },
      marketingPhotosAllowed: request.marketingPhotosAllowed,
      serviceNameSnapshot: String(appointment.servicio ?? ''),
      signaturePath: request.signaturePath,
      signedAt: serverTimestamp(),
      signedBy: actorUid,
      status: 'signed',
      templateHash: clinicalConsentTemplateHash,
      templateId: clinicalConsentTemplate.id,
      templateSnapshot: clinicalConsentTemplate,
      templateVersion: clinicalConsentTemplate.version,
      schemaVersion: 1
    });
    return response;
  });
};
