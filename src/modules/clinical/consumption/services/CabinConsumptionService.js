import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../config/firebase';
import { mapAvailableCabinSupply } from './CabinConsumptionPolicy';

const recordConsumptionCallable = httpsCallable(
  functionsInstance,
  'recordCabinConsumption'
);

// Carga la cita el seguimiento y los insumos disponibles
export const loadCabinConsumption = async ({ appointmentId, clientId }) => {
  const [appointmentSnapshot, sessionSnapshot, consumptionSnapshot, suppliesSnapshot] = await Promise.all([
    getDoc(doc(db, 'citas', appointmentId)),
    getDoc(doc(db, 'sesionesClinicas', appointmentId)),
    getDoc(doc(db, 'consumosCabina', appointmentId)),
    getDocs(query(collection(db, 'insumosCabina'), where('activo', '==', true)))
  ]);
  const appointment = appointmentSnapshot.exists() ? appointmentSnapshot.data() : null;
  const session = sessionSnapshot.exists() ? sessionSnapshot.data() : null;
  if (!appointment || appointment.clienteId !== clientId || appointment.estado !== 'en_cabina') {
    throw new Error('La cita debe estar en cabina para registrar insumos');
  }
  if (session?.status !== 'completed' || session.clientId !== clientId) {
    throw new Error('Completa el seguimiento antes de registrar insumos');
  }
  return {
    appointment: {
      date: String(appointment.fecha ?? ''),
      service: String(appointment.servicio ?? ''),
      time: String(appointment.hora ?? '')
    },
    client: { name: String(appointment.nombreCompleto ?? '') },
    consumption: consumptionSnapshot.exists() ? consumptionSnapshot.data() : null,
    supplies: suppliesSnapshot.docs
      .map(mapAvailableCabinSupply)
      .filter((supply) => supply && supply.stockScaled > 0)
      .sort((first, second) => first.name.localeCompare(second.name, 'es'))
  };
};

// Registra el consumo mediante la función protegida
export const saveCabinConsumption = async (payload) => {
  try {
    const response = await recordConsumptionCallable(payload);
    return response.data;
  } catch (error) {
    const message = error?.message?.replace(/^FirebaseError:\s*/i, '').trim();
    throw new Error(message && !message.includes('INTERNAL')
      ? message
      : 'No pudimos registrar los insumos utilizados', { cause: error });
  }
};

// Crea una identidad única para el intento
export const createCabinConsumptionOperationId = () => (
  globalThis.crypto?.randomUUID?.() ?? `consumption-${Date.now()}`
);
