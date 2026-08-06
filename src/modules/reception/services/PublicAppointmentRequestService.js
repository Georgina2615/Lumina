import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getBlob, ref } from 'firebase/storage';
import {
  db,
  functionsInstance,
  storage
} from '../../../config/firebase';

// Prepara la revisión protegida en el servidor
const reviewRequestCallable = httpsCallable(
  functionsInstance,
  'reviewPublicAppointmentRequest'
);

// Convierte una solicitud al contrato visual
const mapPublicRequest = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    status: data.status,
    client: data.client ?? {},
    service: data.service ?? {},
    schedule: {
      ...data.schedule,
      start: data.schedule?.start?.toDate?.() ?? null,
      blockEnd: data.schedule?.blockEnd?.toDate?.() ?? null
    },
    proof: data.proof ?? {},
    createdAt: data.createdAt?.toDate?.() ?? null
  };
};

// Traduce errores remotos a mensajes claros
const getReviewErrorMessage = (error) => {
  if (error?.code === 'functions/unauthenticated') {
    return 'Inicia sesión para revisar solicitudes';
  }
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permiso para revisar solicitudes';
  }
  if ([
    'functions/failed-precondition',
    'functions/invalid-argument',
    'functions/not-found'
  ].includes(error?.code)) {
    return String(error?.message ?? '')
      .replace(/^Firebase:\s*/i, '')
      .replace(/\s*\(functions\/[a-z-]+\)\.?\s*$/i, '')
      .trim()
      || 'La solicitud cambió y necesita revisión';
  }
  return 'No pudimos actualizar la solicitud';
};

// Escucha solicitudes pendientes en tiempo real
export const subscribePendingPublicRequests = ({ onData, onError }) => (
  onSnapshot(
    query(
      collection(db, 'solicitudesCitaPublica'),
      where('status', '==', 'pending_review')
    ),
    (snapshot) => {
      const requests = snapshot.docs
        .map(mapPublicRequest)
        .sort((first, second) => (
          (first.createdAt?.getTime?.() ?? 0)
          - (second.createdAt?.getTime?.() ?? 0)
        ));
      onData(requests);
    },
    onError
  )
);

// Obtiene la imagen privada al abrir una solicitud
export const getPublicRequestProofFile = async (proofPath) => {
  if (typeof proofPath !== 'string' || !proofPath.trim()) {
    throw new Error('La solicitud no tiene comprobante');
  }
  return getBlob(ref(storage, proofPath), 750 * 1024);
};

// Aprueba o rechaza una solicitud
export const reviewPublicAppointmentRequest = async (request) => {
  try {
    const response = await reviewRequestCallable(request);
    if (
      response.data?.requestId !== request.requestId
      || typeof response.data?.status !== 'string'
    ) {
      throw new Error('La respuesta de revisión está incompleta');
    }
    return response.data;
  } catch (error) {
    throw new Error(getReviewErrorMessage(error), { cause: error });
  }
};
