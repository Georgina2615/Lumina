import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../config/firebase';

const completeAttentionCallable = httpsCallable(
  functionsInstance,
  'completeClinicalAttention'
);

// Carga los requisitos persistidos del cierre
export const loadClinicalCompletion = async ({ appointmentId, clientId }) => {
  const paths = [
    ['citas', appointmentId],
    ['expedientesClinicos', clientId],
    ['consentimientosClinicos', appointmentId],
    ['sesionesClinicas', appointmentId],
    ['consumosCabina', appointmentId],
    ['recomendacionesCuidado', appointmentId]
  ];
  const snapshots = await Promise.all(paths.map(([collectionName, documentId]) => getDoc(doc(db, collectionName, documentId))));
  const [appointmentSnapshot, recordSnapshot, consentSnapshot, sessionSnapshot, consumptionSnapshot, recommendationSnapshot] = snapshots;
  const appointment = appointmentSnapshot.exists() ? appointmentSnapshot.data() : null;
  if (!appointment || appointment.clienteId !== clientId || appointment.estado !== 'en_cabina') {
    throw new Error('La cita debe estar en cabina para terminar la atención');
  }
  const requirements = [
    { complete: recordSnapshot.data()?.status === 'completed', id: 'record', label: 'Ficha técnica completa' },
    { complete: consentSnapshot.data()?.status === 'signed', id: 'consent', label: 'Consentimiento firmado' },
    { complete: sessionSnapshot.data()?.status === 'completed', id: 'session', label: 'Seguimiento terminado' },
    { complete: consumptionSnapshot.data()?.status === 'recorded', id: 'consumption', label: 'Insumos utilizados registrados' },
    { complete: recommendationSnapshot.data()?.status === 'saved', id: 'recommendation', label: 'Recomendaciones guardadas' }
  ];
  return {
    appointment: { service: String(appointment.servicio ?? '') },
    client: { name: String(appointment.nombreCompleto ?? '') },
    ready: requirements.every(({ complete }) => complete),
    requirements
  };
};

// Termina la atención mediante la función protegida
export const completeClinicalAttention = async (payload) => {
  try {
    const response = await completeAttentionCallable(payload);
    return response.data;
  } catch (error) {
    const message = error?.message?.replace(/^FirebaseError:\s*/i, '').trim();
    throw new Error(message && !message.includes('INTERNAL')
      ? message
      : 'No pudimos terminar la atención', { cause: error });
  }
};

// Crea una identidad única para el cierre
export const createClinicalCompletionOperationId = () => (
  globalThis.crypto?.randomUUID?.() ?? `clinical-completion-${Date.now()}`
);
