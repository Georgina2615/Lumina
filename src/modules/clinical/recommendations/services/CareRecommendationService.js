import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../config/firebase';
import { mapRecommendedProduct, mapRecommendedService } from './CareRecommendationPolicy';

const manageRecommendationCallable = httpsCallable(
  functionsInstance,
  'manageCareRecommendation'
);

// Carga la cita el historial y los catálogos activos
export const loadCareRecommendation = async ({ appointmentId, clientId }) => {
  const [appointmentSnapshot, sessionSnapshot, recommendationSnapshot, productsSnapshot, servicesSnapshot] = await Promise.all([
    getDoc(doc(db, 'citas', appointmentId)),
    getDoc(doc(db, 'sesionesClinicas', appointmentId)),
    getDoc(doc(db, 'recomendacionesCuidado', appointmentId)),
    getDocs(query(collection(db, 'productos'), where('activo', '==', true))),
    getDocs(query(collection(db, 'servicios'), where('activo', '==', true)))
  ]);
  const appointment = appointmentSnapshot.exists() ? appointmentSnapshot.data() : null;
  const session = sessionSnapshot.exists() ? sessionSnapshot.data() : null;
  if (!appointment || appointment.clienteId !== clientId || appointment.estado !== 'en_cabina') {
    throw new Error('La cita debe estar en cabina para guardar recomendaciones');
  }
  if (session?.clientId !== clientId || session?.status !== 'completed') {
    throw new Error('Completa el seguimiento antes de guardar recomendaciones');
  }
  const recommendation = recommendationSnapshot.exists() ? recommendationSnapshot.data() : null;
  return {
    appointment: {
      date: String(appointment.fecha ?? ''),
      service: String(appointment.servicio ?? ''),
      time: String(appointment.hora ?? '')
    },
    client: { name: String(appointment.nombreCompleto ?? '') },
    products: productsSnapshot.docs.map(mapRecommendedProduct)
      .sort((first, second) => first.name.localeCompare(second.name, 'es')),
    recommendation,
    services: servicesSnapshot.docs.map(mapRecommendedService)
      .sort((first, second) => first.name.localeCompare(second.name, 'es'))
  };
};

// Guarda las recomendaciones mediante la función protegida
export const saveCareRecommendation = async (payload) => {
  try {
    const response = await manageRecommendationCallable(payload);
    return response.data;
  } catch (error) {
    const message = error?.message?.replace(/^FirebaseError:\s*/i, '').trim();
    throw new Error(message && !message.includes('INTERNAL')
      ? message
      : 'No pudimos guardar las recomendaciones', { cause: error });
  }
};

// Crea una identidad única para reintentos seguros
export const createCareRecommendationOperationId = () => (
  globalThis.crypto?.randomUUID?.() ?? `care-recommendation-${Date.now()}`
);
