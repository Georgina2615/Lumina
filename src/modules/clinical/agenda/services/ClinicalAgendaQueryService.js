import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../../config/firebase';
import {
  mapClinicalAppointment,
  sortClinicalAppointments
} from './ClinicalAgendaPolicy';

// Escucha las citas reales de una jornada
export const subscribeClinicalAgenda = ({ dateKey, onData, onError }) => {
  const agendaQuery = query(
    collection(db, 'citas'),
    where('fecha', '==', dateKey)
  );

  // Publica únicamente citas compatibles con el flujo clínico
  return onSnapshot(
    agendaQuery,
    (snapshot) => {
      const appointments = snapshot.docs
        .map((documentSnapshot) => mapClinicalAppointment(
          documentSnapshot.id,
          documentSnapshot.data()
        ))
        .filter(Boolean);

      onData(sortClinicalAppointments(appointments));
    },
    onError
  );
};
