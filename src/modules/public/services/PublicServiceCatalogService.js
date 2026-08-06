import {
  collection,
  getDocs,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Convierte un servicio real al contrato publico
const mapPublicService = (documentSnapshot) => {
  const data = documentSnapshot.data();

  // Devuelve solo informacion comercial
  return {
    id: documentSnapshot.id,
    name: String(data.nombre ?? '').trim(),
    description: String(data.descripcionPublica ?? '').trim(),
    priceCents: Number.isSafeInteger(data.precioCentavos)
      ? data.precioCentavos
      : null,
    durationMinutes: Number.isSafeInteger(data.duracionServicioMinutos)
      ? data.duracionServicioMinutos
      : null,
    order: Number.isSafeInteger(data.orden) ? data.orden : 999
  };
};

// Carga una fotografia puntual de los servicios activos
export const loadPublicServices = async () => {
  const servicesQuery = query(
    collection(db, 'servicios'),
    where('activo', '==', true)
  );
  const snapshot = await getDocs(servicesQuery);

  // Descarta contratos incompletos y conserva el orden comercial
  return snapshot.docs
    .map(mapPublicService)
    .filter((service) => service.name && service.priceCents > 0)
    .sort((first, second) => (
      first.order - second.order
      || first.name.localeCompare(second.name, 'es')
    ));
};
