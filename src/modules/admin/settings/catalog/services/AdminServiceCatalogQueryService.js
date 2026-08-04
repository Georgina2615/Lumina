import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import {
  isServiceCatalogDocumentValid
} from './AdminServiceCatalogPolicy';

// Convierte un documento al contrato visual
const mapService = (documentSnapshot) => {
  const data = documentSnapshot.data();
  const rawName = typeof data.nombre === 'string' ? data.nombre : '';
  const name = rawName.trim().replace(/\s+/g, ' ');
  const priceCents = Number.isSafeInteger(data.precioCentavos)
    ? data.precioCentavos
    : null;
  const order = Number.isSafeInteger(data.orden) ? data.orden : 999;
  const publicDescription = data.descripcionPublica == null
    ? ''
    : data.descripcionPublica;
  const canBeOffered = isServiceCatalogDocumentValid(data);

  // Devuelve datos compatibles con documentos heredados
  return {
    active: data.activo === true,
    canBeOffered,
    displayName: name || 'Servicio sin nombre',
    id: documentSnapshot.id,
    name,
    order,
    priceCents,
    publicDescription: typeof publicDescription === 'string'
      ? publicDescription.trim()
      : '',
    revision: Number.isSafeInteger(data.revision) ? data.revision : 0
  };
};

// Carga una fotografia real de todos los servicios
export const loadAdminServices = async () => {
  const snapshot = await getDocs(collection(db, 'servicios'));

  return snapshot.docs
    .map(mapService)
    .sort((first, second) => (
      first.order - second.order
      || first.name.localeCompare(second.name, 'es')
    ));
};
