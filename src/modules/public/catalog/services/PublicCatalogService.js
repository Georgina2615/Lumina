import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../../config/firebase';
import { normalizePublicCatalog } from './PublicCatalogPolicy';

const getCatalogCall = httpsCallable(functionsInstance, 'getPublicProductCatalog');

// Traduce fallos técnicos a un mensaje comprensible
const mapCatalogError = () => new Error('No pudimos cargar los productos en este momento');

// Solicita el catálogo comercial publicado
export const loadPublicProductCatalog = async () => {
  try {
    const response = await getCatalogCall();
    return normalizePublicCatalog(response.data);
  } catch {
    throw mapCatalogError();
  }
};
