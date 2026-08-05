import { FieldValue } from 'firebase-admin/firestore';
import { buildCareRecommendationDocument, buildCareRecommendationResponse } from './CareRecommendationDocuments.js';
import {
  requireCareRecommendationActor,
  requireCareRecommendationAppointment,
  requireCareRecommendationClinicalWork,
  requireRecommendedProduct,
  requireRecommendedService,
  requireStoredCareRecommendation
} from './CareRecommendationStoredPolicy.js';

// Guarda una recomendación y sus referencias reales
export const runManageCareRecommendationTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const references = {
    actor: firestore.collection('usuarios').doc(actorUid),
    appointment: firestore.collection('citas').doc(request.appointmentId),
    client: firestore.collection('clientes').doc(request.clientId),
    recommendation: firestore.collection('recomendacionesCuidado').doc(request.appointmentId),
    session: firestore.collection('sesionesClinicas').doc(request.appointmentId)
  };
  const productReferences = request.recommendation.productIds.map((id) => firestore.collection('productos').doc(id));
  const serviceReference = request.recommendation.serviceId
    ? firestore.collection('servicios').doc(request.recommendation.serviceId)
    : null;

  return firestore.runTransaction(async (transaction) => {
    const baseReferences = Object.values(references);
    const snapshots = await transaction.getAll(
      ...baseReferences,
      ...productReferences,
      ...(serviceReference ? [serviceReference] : [])
    );
    const [actorSnapshot, appointmentSnapshot, clientSnapshot, recommendationSnapshot, sessionSnapshot] = snapshots;
    requireCareRecommendationActor(actorSnapshot);
    const appointment = requireCareRecommendationAppointment({
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      snapshot: appointmentSnapshot
    });
    requireCareRecommendationClinicalWork({ clientId: request.clientId, clientSnapshot, sessionSnapshot });
    const storedState = requireStoredCareRecommendation({
      expectedRevision: request.expectedRevision,
      operationId: request.operationId,
      requestHash,
      snapshot: recommendationSnapshot
    });
    if (storedState.existingResult) return storedState.existingResult;

    const products = productReferences.map((reference, index) => (
      requireRecommendedProduct(snapshots[baseReferences.length + index], reference.id)
    ));
    const serviceSnapshot = serviceReference
      ? snapshots[baseReferences.length + productReferences.length]
      : null;
    const recommendedService = requireRecommendedService(serviceSnapshot, request.recommendation.serviceId);
    const response = buildCareRecommendationResponse({
      appointmentId: request.appointmentId,
      productCount: products.length,
      revision: (storedState.stored?.revision ?? 0) + 1
    });
    const document = buildCareRecommendationDocument({
      actorUid,
      appointment,
      products,
      recommendedService,
      request,
      requestHash,
      response,
      stored: storedState.stored,
      timestamp: serverTimestamp()
    });

    transaction.set(references.recommendation, document);
    return response;
  });
};
