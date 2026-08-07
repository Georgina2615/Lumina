import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../../config/firebase';
import { loadRetailInventory } from '../../../inventory/services/RetailInventoryQueryService';
import { loadAdminServices } from '../../catalog/services/AdminServiceCatalogQueryService';
import { createRecommendedSkinTest } from './AdminSkinTestDefaults';

const manageSkinTestCall = httpsCallable(functionsInstance, 'manageSkinTestConfig');

// Convierte una configuración guardada al formulario
const mapStoredConfig = (snapshot, services) => {
  if (!snapshot.exists()) return createRecommendedSkinTest(services);
  const data = snapshot.data();
  return {
    active: data.activo === true,
    questions: Array.isArray(data.preguntas) ? data.preguntas : [],
    results: data.recomendaciones ?? {},
    revision: Number.isSafeInteger(data.revision) ? data.revision : 0
  };
};

// Carga la configuración y los catálogos reales
export const loadAdminSkinTest = async () => {
  const [snapshot, services, inventory] = await Promise.all([
    getDoc(doc(db, 'configuracionTestPiel', 'principal')),
    loadAdminServices(),
    loadRetailInventory()
  ]);
  return {
    config: mapStoredConfig(snapshot, services),
    products: inventory.products.filter(({ active }) => active),
    services: services.filter(({ active, canBeOffered }) => active && canBeOffered)
  };
};

// Guarda la configuración mediante el servidor
export const saveAdminSkinTest = async (command) => {
  try {
    const response = await manageSkinTestCall(command);
    return response.data;
  } catch (error) {
    if (error?.code === 'functions/aborted') {
      throw new Error('El test cambió en otra ventana Actualiza antes de guardar', { cause: error });
    }
    if (error?.code === 'functions/failed-precondition') {
      throw new Error(error.message || 'Revisa los servicios y productos seleccionados', { cause: error });
    }
    if (error?.code === 'functions/permission-denied') {
      throw new Error('Tu cuenta no puede configurar el test de piel', { cause: error });
    }
    throw new Error('No pudimos guardar el test de piel', { cause: error });
  }
};
