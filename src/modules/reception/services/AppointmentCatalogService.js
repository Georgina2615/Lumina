import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Convierte el servicio al contrato de interfaz
const mapService = (snapshot) => {
  // Obtiene los datos vigentes
  const data = snapshot.data();

  // Devuelve el servicio normalizado
  return {
    id: snapshot.id,
    name: data.nombre,
    priceCents: data.precioCentavos,
    serviceDurationMinutes: data.duracionServicioMinutos,
    preparationMinutes: data.tiempoPreparacionMinutos,
    blockDurationMinutes: data.duracionBloqueMinutos,
    depositPercentage: data.porcentajeAnticipo,
    order: data.orden
  };
};

// Convierte el cupo al contrato de interfaz
const mapSlot = (snapshot) => {
  // Obtiene los datos vigentes
  const data = snapshot.data();

  // Devuelve el cupo normalizado
  return {
    id: snapshot.id,
    appointmentId: data.citaId,
    clientId: data.clienteId,
    dateKey: data.fecha,
    time: data.hora,
    start: data.inicio?.toDate?.() ?? null,
    blockEnd: data.finBloque?.toDate?.() ?? null,
    blockDurationMinutes: data.duracionBloqueMinutos
  };
};

// Escucha el catálogo operativo
export const subscribeActiveServices = ({ onData, onError }) => (
  onSnapshot(
    query(collection(db, 'servicios'), where('activo', '==', true)),
    (snapshot) => {
      // Ordena los servicios disponibles
      const services = snapshot.docs.map(mapService).sort(
        (first, second) => (
          first.order - second.order
          || first.name.localeCompare(second.name, 'es')
        )
      );

      // Entrega el catálogo vigente
      onData(services);
    },
    onError
  )
);

// Escucha los cupos ocupados de una fecha
export const subscribeSlotsByDate = ({ dateKey, onData, onError }) => {
  // Detiene fechas fuera del contrato
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? ''))) {
    throw new Error('La fecha no es válida');
  }

  // Construye la consulta diaria
  const slotsQuery = query(
    collection(db, 'cupos'),
    where('fecha', '==', dateKey)
  );

  // Devuelve la cancelación de la escucha
  return onSnapshot(
    slotsQuery,
    (snapshot) => onData(snapshot.docs.map(mapSlot)),
    onError
  );
};
