import {
  formatCabinQuantity,
  getCabinQuantityScale,
  parseCabinQuantity
} from '../../../../shared/services/CabinQuantityService.js';

// Convierte un insumo activo al contrato clínico
export const mapAvailableCabinSupply = (snapshot) => {
  const data = snapshot.data();
  const unit = String(data.unidad ?? '');
  if (
    data.schemaVersion !== 1
    || data.activo !== true
    || data.sucursalId !== 'principal'
    || !getCabinQuantityScale(unit)
    || !Number.isSafeInteger(data.existenciasEscaladas)
    || !Number.isSafeInteger(data.revision)
  ) return null;
  return {
    category: String(data.categoria ?? ''),
    id: snapshot.id,
    name: String(data.nombre ?? '').trim(),
    revision: data.revision,
    stockLabel: formatCabinQuantity(data.existenciasEscaladas, unit),
    stockScaled: data.existenciasEscaladas,
    unit
  };
};

// Filtra insumos por su nombre o categoría
export const filterAvailableCabinSupplies = (supplies, search) => {
  const term = search.trim().toLocaleLowerCase('es');
  if (!term) return supplies;
  return supplies.filter(({ category, name }) => (
    `${name} ${category}`.toLocaleLowerCase('es').includes(term)
  ));
};

// Valida y traduce las cantidades seleccionadas
export const buildCabinConsumptionItems = (selectedItems) => {
  if (selectedItems.length === 0) {
    throw new Error('Agrega al menos un insumo utilizado');
  }
  return selectedItems.map(({ quantity, supply }) => {
    const quantityScaled = parseCabinQuantity(quantity, supply.unit);
    if (quantityScaled === null) {
      throw new Error(`Escribe una cantidad válida para ${supply.name}`);
    }
    if (quantityScaled > supply.stockScaled) {
      throw new Error(`La cantidad de ${supply.name} supera lo disponible`);
    }
    return {
      expectedRevision: supply.revision,
      quantityScaled,
      supplyId: supply.id
    };
  });
};
