import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../config/firebase';

// Convierte costos privados en un mapa estable
const mapPrivateCosts = (snapshot) => new Map(
  snapshot.docs.map((documentSnapshot) => {
    const data = documentSnapshot.data();
    const averageCostCents = Number.isSafeInteger(data.costoPromedioCentavos)
      && data.costoPromedioCentavos > 0
      ? data.costoPromedioCentavos
      : null;

    return [documentSnapshot.id, averageCostCents];
  })
);

// Convierte un producto aunque pertenezca al contrato heredado
const mapRetailProduct = (documentSnapshot, costs, costsUnavailable) => {
  const data = documentSnapshot.data();
  const warnings = [];
  const name = String(data.nombre ?? '').trim();
  const category = String(data.categoria ?? '').trim();

  if (
    data.schemaVersion !== 1
    || !name
    || !category
    || !Number.isSafeInteger(data.precioCentavos)
    || data.precioCentavos <= 0
    || !Number.isSafeInteger(data.existencias)
    || data.existencias < 0
    || !Number.isSafeInteger(data.stockMinimo)
    || data.stockMinimo < 0
  ) {
    warnings.push('Contrato de producto incompleto');
  }

  if (!String(data.marca ?? '').trim()) {
    warnings.push('Marca pendiente');
  }

  if (!String(data.sku ?? '').trim()) {
    warnings.push('Código interno pendiente');
  }

  if (!costsUnavailable && !costs.has(documentSnapshot.id)) {
    warnings.push('Costo privado pendiente');
  }

  return {
    active: data.activo === true,
    averageCostCents: costs.get(documentSnapshot.id) ?? null,
    brand: String(data.marca ?? '').trim() || 'Sin marca',
    category: category || 'Sin categoría',
    description: String(data.descripcion ?? '').trim(),
    id: documentSnapshot.id,
    imagePath: String(data.imagenRuta ?? '').trim(),
    imageUrl: String(data.imagenUrl ?? '').trim(),
    minimumStock: Number.isSafeInteger(data.stockMinimo)
      ? data.stockMinimo
      : 0,
    name: name || 'Producto sin nombre',
    priceCents: Number.isSafeInteger(data.precioCentavos)
      ? data.precioCentavos
      : null,
    revision: Number.isSafeInteger(data.revision) ? data.revision : 0,
    sku: String(data.sku ?? '').trim() || 'Código pendiente',
    stock: Number.isSafeInteger(data.existencias) ? data.existencias : 0,
    warnings
  };
};

// Carga productos y costos con una sola fotografía manual
export const loadRetailInventory = async () => {
  const [productsResult, costsResult] = await Promise.allSettled([
    getDocs(collection(db, 'productos')),
    getDocs(collection(db, 'costosProductos'))
  ]);

  if (productsResult.status === 'rejected') {
    throw productsResult.reason;
  }

  const productsSnapshot = productsResult.value;
  let costs = new Map();
  const costsUnavailable = costsResult.status === 'rejected';

  if (!costsUnavailable) {
    costs = mapPrivateCosts(costsResult.value);
  }

  const products = productsSnapshot.docs
    .map((documentSnapshot) => mapRetailProduct(
      documentSnapshot,
      costs,
      costsUnavailable
    ))
    .sort((first, second) => (
      first.name.localeCompare(second.name, 'es')
    ));

  return { costsUnavailable, products };
};
