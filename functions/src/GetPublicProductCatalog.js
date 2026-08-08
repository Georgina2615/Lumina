import { mapPublicProduct, sortPublicProducts } from './PublicProductDocuments.js';

// Entrega el catálogo comercial sin información privada
export const getPublicProductCatalogHandler = async ({ firestore }) => {
  const snapshot = await firestore.collection('productos')
    .where('activo', '==', true)
    .limit(100)
    .get();
  const mapped = snapshot.docs.map(mapPublicProduct);
  const products = sortPublicProducts(mapped.filter(Boolean));

  return {
    products,
    warningCount: mapped.length - products.length
  };
};
