import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../../../config/firebase';
import { getCabinQuantityScale } from '../../../../../shared/services/CabinQuantityService';

// Reconoce texto obligatorio del contrato
const hasValidRequiredText = (value, minimum, maximum) => (
  typeof value === 'string'
  && value.trim().length >= minimum
  && value.trim().length <= maximum
);

// Reconoce texto opcional del contrato
const hasValidOptionalText = (value, maximum) => (
  typeof value === 'string' && value.trim().length <= maximum
);

// Convierte costos privados en un mapa estable
const mapCabinCosts = (snapshot) => new Map(
  snapshot.docs.flatMap((documentSnapshot) => {
    const data = documentSnapshot.data();
    const inventoryValueCents = Number.isSafeInteger(
      data.valorInventarioCentavos
    ) && data.valorInventarioCentavos >= 0
      ? data.valorInventarioCentavos
      : null;

    if (
      data.schemaVersion !== 1
      || data.insumoId !== documentSnapshot.id
      || data.sucursalId !== 'principal'
      || inventoryValueCents === null
      || inventoryValueCents > 1_000_000_000
    ) {
      return [];
    }

    return [[documentSnapshot.id, inventoryValueCents]];
  })
);

// Convierte un insumo al contrato visual estable
const mapCabinSupply = (documentSnapshot, costs, costsUnavailable) => {
  const data = documentSnapshot.data();
  const warnings = [];
  const name = typeof data.nombre === 'string' ? data.nombre.trim() : '';
  const brand = typeof data.marca === 'string' ? data.marca.trim() : '';
  const category = typeof data.categoria === 'string'
    ? data.categoria.trim()
    : '';
  const description = typeof data.descripcion === 'string'
    ? data.descripcion.trim()
    : '';
  const unit = typeof data.unidad === 'string' ? data.unidad.trim() : '';
  const validUnit = ['ml', 'g', 'pieza'].includes(unit);

  if (
    data.schemaVersion !== 1
    || !hasValidRequiredText(data.nombre, 2, 120)
    || !hasValidOptionalText(data.marca, 80)
    || !hasValidRequiredText(data.categoria, 2, 80)
    || !hasValidOptionalText(data.descripcion, 500)
    || !validUnit
    || data.factorEscala !== getCabinQuantityScale(unit)
    || !Number.isSafeInteger(data.existenciasEscaladas)
    || data.existenciasEscaladas < 0
    || data.existenciasEscaladas > 999_999_999
    || !Number.isSafeInteger(data.stockMinimoEscalado)
    || data.stockMinimoEscalado < 0
    || data.stockMinimoEscalado > 999_999_999
    || data.sucursalId !== 'principal'
    || typeof data.activo !== 'boolean'
    || !Number.isSafeInteger(data.revision)
    || data.revision < 1
  ) {
    warnings.push('Contrato de insumo incompleto');
  }

  if (!costsUnavailable && !costs.has(documentSnapshot.id)) {
    warnings.push('Costo privado pendiente');
  }

  return {
    active: data.activo === true,
    brand: brand || 'Sin marca',
    category: category || 'Sin categoría',
    description,
    id: documentSnapshot.id,
    inventoryValueCents: costs.get(documentSnapshot.id) ?? null,
    minimumStockScaled: Number.isSafeInteger(data.stockMinimoEscalado)
      ? data.stockMinimoEscalado
      : 0,
    name: name || 'Insumo sin nombre',
    revision: Number.isSafeInteger(data.revision) ? data.revision : 0,
    stockScaled: Number.isSafeInteger(data.existenciasEscaladas)
      ? data.existenciasEscaladas
      : 0,
    unit: validUnit ? unit : 'pieza',
    warnings
  };
};

// Carga insumos y costos con una fotografía manual
export const loadCabinInventory = async () => {
  const [suppliesResult, costsResult] = await Promise.allSettled([
    getDocs(collection(db, 'insumosCabina')),
    getDocs(collection(db, 'costosInsumosCabina'))
  ]);

  if (suppliesResult.status === 'rejected') {
    throw suppliesResult.reason;
  }

  const costsUnavailable = costsResult.status === 'rejected';
  const costs = costsUnavailable
    ? new Map()
    : mapCabinCosts(costsResult.value);
  const supplies = suppliesResult.value.docs
    .map((documentSnapshot) => mapCabinSupply(
      documentSnapshot,
      costs,
      costsUnavailable
    ))
    .sort((first, second) => first.name.localeCompare(second.name, 'es'));

  return { costsUnavailable, supplies };
};
