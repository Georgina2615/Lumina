import { logger } from 'firebase-functions';
import { HttpsError } from 'firebase-functions/v2/https';
import {
  buildPublicSkinQuestionnaire,
  calculatePublicSkinResult,
  requirePublishedSkinTest,
  validatePublicSkinAnswers
} from './PublicSkinTestPolicy.js';

// Convierte errores conocidos al contrato remoto
const mapError = (error) => {
  if (error instanceof HttpsError) return error;
  if (error?.name === 'PublicSkinTestError') {
    return new HttpsError(error.code, error.message);
  }
  logger.error('Fallo inesperado en el test público de piel', {
    errorCode: error?.code ?? null,
    errorName: error?.name ?? 'Error'
  });
  return new HttpsError('internal', 'No pudimos completar el test de piel');
};

// Convierte un servicio a información pública
const mapService = (snapshot) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (data?.activo !== true || !Number.isSafeInteger(data?.precioCentavos)) return null;
  return {
    description: String(data.descripcionPublica ?? '').trim(),
    durationMinutes: Number.isSafeInteger(data.duracionServicioMinutos)
      ? data.duracionServicioMinutos
      : null,
    id: snapshot.id,
    name: String(data.nombre ?? '').trim(),
    priceCents: data.precioCentavos
  };
};

// Convierte productos disponibles a información pública
const mapProducts = (snapshots) => snapshots.flatMap((snapshot) => {
  const data = snapshot.exists ? snapshot.data() : null;
  if (
    data?.activo !== true
    || !Number.isSafeInteger(data?.existencias)
    || data.existencias < 1
    || !Number.isSafeInteger(data?.precioCentavos)
  ) return [];
  return [{
    brand: String(data.marca ?? '').trim(),
    description: String(data.descripcion ?? '').trim(),
    id: snapshot.id,
    imageUrl: String(data.imagenUrl ?? '').trim(),
    name: String(data.nombre ?? '').trim(),
    priceCents: data.precioCentavos
  }];
});

// Carga la configuración publicada
const loadPublishedConfig = async (firestore) => {
  const snapshot = await firestore.collection('configuracionTestPiel').doc('principal').get();
  return requirePublishedSkinTest(snapshot);
};

// Entrega preguntas sin reglas internas
export const getPublicSkinTestHandler = async ({ firestore }) => {
  try {
    const config = await loadPublishedConfig(firestore);
    return buildPublicSkinQuestionnaire(config);
  } catch (error) {
    throw mapError(error);
  }
};

// Calcula y completa una recomendación real
export const evaluatePublicSkinTestHandler = async ({ data, firestore }) => {
  try {
    const config = await loadPublishedConfig(firestore);
    const answers = validatePublicSkinAnswers(data, config);
    const calculated = calculatePublicSkinResult(config, answers);
    const recommendation = calculated.recommendation;
    if (!recommendation?.serviceId) {
      throw new Error('La recomendación publicada está incompleta');
    }
    const references = [
      firestore.collection('servicios').doc(recommendation.serviceId),
      ...recommendation.productIds.map((id) => firestore.collection('productos').doc(id))
    ];
    const [serviceSnapshot, ...productSnapshots] = await firestore.getAll(...references);
    const service = mapService(serviceSnapshot);
    if (!service?.name) throw new Error('El servicio recomendado no está disponible');
    return {
      products: mapProducts(productSnapshots),
      requiresContact: calculated.requiresContact,
      resultKey: calculated.resultKey,
      service,
      summary: recommendation.summary,
      title: recommendation.title
    };
  } catch (error) {
    throw mapError(error);
  }
};
