import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { canCancelAppointment } from './AppointmentService';

// Ordena las citas por fecha y hora
const sortAppointments = (appointments) => {
  // Devuelve las citas ordenadas
  return [...appointments].sort((first, second) => {
    // Crea la clave de la primera cita
    const firstKey = `${first.fecha ?? ''} ${first.hora ?? ''}`;
    const secondKey = `${second.fecha ?? ''} ${second.hora ?? ''}`;

    // Devuelve la comparación de las claves
    return firstKey.localeCompare(secondKey);
  });
};

// Convierte documentos en citas
const mapSnapshot = (snapshot) => {
  // Crea la lista de citas
  const appointments = snapshot.docs.map((documentSnapshot) => {
    // Obtiene los datos vigentes
    const appointment = documentSnapshot.data();

    // Devuelve la cita con sus capacidades
    return {
      id: documentSnapshot.id,
      ...appointment,
      canCancel: canCancelAppointment(appointment)
    };
  });

  // Devuelve la lista ordenada
  return sortAppointments(appointments);
};

// Formatea una fecha local para Firestore
export const formatDateKey = (date) => {
  // Obtiene las partes de la fecha
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Devuelve la fecha normalizada
  return `${year}-${month}-${day}`;
};

// Escucha una columna del tablero
export const subscribeAppointmentsByStatus = ({
  status,
  dateKey,
  onData,
  onError
}) => {
  // Define los filtros de la consulta
  const constraints = [where('estado', '==', status)];

  // Agrega el filtro diario cuando corresponde
  if (dateKey) {
    constraints.push(where('fecha', '==', dateKey));
  }

  // Construye la consulta de citas
  const appointmentsQuery = query(collection(db, 'citas'), ...constraints);

  // Devuelve la cancelación de la escucha
  return onSnapshot(
    appointmentsQuery,
    (snapshot) => onData(mapSnapshot(snapshot)),
    onError
  );
};

// Escucha las citas del rango visible
export const subscribeCalendarAppointments = ({
  startDateKey,
  endDateKey,
  onData,
  onError
}) => {
  // Construye la consulta por rango
  const appointmentsQuery = query(
    collection(db, 'citas'),
    where('fecha', '>=', startDateKey),
    where('fecha', '<=', endDateKey)
  );

  // Devuelve la cancelación de la escucha
  return onSnapshot(
    appointmentsQuery,
    (snapshot) => onData(mapSnapshot(snapshot)),
    onError
  );
};
