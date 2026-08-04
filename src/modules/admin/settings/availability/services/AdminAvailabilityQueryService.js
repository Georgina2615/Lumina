import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../../config/firebase';

// Convierte un cupo real al contrato visual
const mapAvailabilitySlot = (snapshot) => {
  const data = snapshot.data();
  const isBlocked = data.tipo === 'bloqueo_admin';

  // Protege documentos anteriores como citas ocupadas
  return {
    appointmentId: typeof data.citaId === 'string' ? data.citaId : null,
    blockEnd: data.finBloque?.toDate?.() ?? null,
    createdAt: data.creadoEn?.toDate?.() ?? null,
    dateKey: typeof data.fecha === 'string' ? data.fecha : '',
    id: snapshot.id,
    kind: isBlocked ? 'blocked' : 'appointment',
    reason: isBlocked && typeof data.motivo === 'string'
      ? data.motivo
      : '',
    start: data.inicio?.toDate?.() ?? null,
    time: typeof data.hora === 'string' ? data.hora : ''
  };
};

// Escucha los cupos de la fecha elegida
export const subscribeAdminSlotsByDate = ({ dateKey, onData, onError }) => (
  onSnapshot(
    query(collection(db, 'cupos'), where('fecha', '==', dateKey)),
    (snapshot) => onData(snapshot.docs.map(mapAvailabilitySlot)),
    onError
  )
);

// Escucha todos los bloqueos y conserva solo los proximos
export const subscribeUpcomingAdminBlocks = ({
  fromDateKey,
  onData,
  onError
}) => (
  onSnapshot(
    query(collection(db, 'cupos'), where('tipo', '==', 'bloqueo_admin')),
    (snapshot) => {
      const blocks = snapshot.docs
        .map(mapAvailabilitySlot)
        .filter(({ dateKey, start }) => (
          dateKey > fromDateKey
          || (dateKey === fromDateKey && start?.getTime() >= Date.now())
        ))
        .sort((first, second) => (
          first.dateKey.localeCompare(second.dateKey)
          || first.time.localeCompare(second.time)
        ))
        .slice(0, 12);

      onData(blocks);
    },
    onError
  )
);
