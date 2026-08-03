import {
  CABIN_BRANCH_ID,
  CABIN_UNIT_SCALES
} from './CabinInventoryCalculations.js';

// Conserva la auditoría previa o crea una compatible
const buildAudit = ({ actorUid, supply, timestamp }) => ({
  creadaEn: supply?.auditoria?.creadaEn ?? timestamp,
  creadaPor: typeof supply?.auditoria?.creadaPor === 'string'
    ? supply.auditoria.creadaPor
    : actorUid,
  actualizadaEn: timestamp,
  actualizadaPor: actorUid
});

// Construye la respuesta pública de una operación
export const buildCabinSupplyResponse = ({
  action,
  active,
  inventoryValueCents,
  operationId,
  revision,
  stockScaled,
  supplyId
}) => ({
  action,
  supplyId,
  operationId,
  revision,
  active,
  stockScaled,
  inventoryValueCents,
  alreadyProcessed: false
});

// Construye un insumo nuevo
export const buildCabinSupplyDocument = ({
  actorUid,
  request,
  timestamp
}) => ({
  schemaVersion: 1,
  nombre: request.name,
  marca: request.brand,
  categoria: request.category,
  descripcion: request.description,
  unidad: request.unit,
  factorEscala: CABIN_UNIT_SCALES[request.unit],
  existenciasEscaladas: request.initialQuantityScaled,
  stockMinimoEscalado: request.minimumStockScaled,
  sucursalId: CABIN_BRANCH_ID,
  activo: true,
  revision: 1,
  auditoria: buildAudit({ actorUid, supply: null, timestamp })
});

// Construye el valor privado de un insumo
export const buildPrivateCabinCostDocument = ({
  actorUid,
  inventoryValueCents,
  supplyId,
  timestamp
}) => ({
  schemaVersion: 1,
  insumoId: supplyId,
  valorInventarioCentavos: inventoryValueCents,
  sucursalId: CABIN_BRANCH_ID,
  actualizadaEn: timestamp,
  actualizadaPor: actorUid
});

// Construye la edición completa del insumo
export const buildCabinSupplyUpdate = ({
  actorUid,
  request,
  supply,
  timestamp
}) => ({
  nombre: request.name,
  marca: request.brand,
  categoria: request.category,
  descripcion: request.description,
  stockMinimoEscalado: request.minimumStockScaled,
  revision: request.expectedRevision + 1,
  auditoria: buildAudit({ actorUid, supply, timestamp })
});

// Construye una actualización de estado
export const buildCabinSupplyStatePatch = ({
  actorUid,
  request,
  supply,
  timestamp
}) => ({
  activo: request.active,
  revision: request.expectedRevision + 1,
  auditoria: buildAudit({ actorUid, supply, timestamp })
});

// Construye una actualización de existencias
export const buildCabinStockPatch = ({
  actorUid,
  nextStockScaled,
  revision,
  supply,
  timestamp
}) => ({
  existenciasEscaladas: nextStockScaled,
  revision,
  auditoria: buildAudit({ actorUid, supply, timestamp })
});

// Construye el registro idempotente de una operación
const buildOperationFields = ({
  actorUid,
  request,
  requestHash,
  response,
  timestamp
}) => ({
  insumoId: request.supplyId,
  sucursalId: CABIN_BRANCH_ID,
  fecha: timestamp,
  actorUid,
  idempotencia: {
    clave: request.operationId,
    hashSolicitud: requestHash
  },
  resultado: response,
  schemaVersion: 1
});

// Construye un movimiento de administración
export const buildCabinManagementMovement = ({
  actorUid,
  inventoryValueCents,
  request,
  requestHash,
  response,
  supplyName,
  timestamp
}) => ({
  ...buildOperationFields({
    actorUid,
    request,
    requestHash,
    response,
    timestamp
  }),
  insumoNombre: supplyName,
  tipo: request.action === 'create' ? 'entrada_inicial' : 'gestion_insumo',
  accion: request.action,
  unidad: request.action === 'create' ? request.unit : null,
  cantidadEscalada: request.action === 'create'
    ? request.initialQuantityScaled
    : 0,
  cambioExistenciasEscalado: request.action === 'create'
    ? request.initialQuantityScaled
    : 0,
  existenciasAnterioresEscaladas: request.action === 'create' ? 0 : null,
  existenciasPosterioresEscaladas: request.action === 'create'
    ? request.initialQuantityScaled
    : null,
  costoTotalCentavos: request.action === 'create'
    ? request.inventoryValueCents
    : null,
  valorInventarioAnteriorCentavos: request.action === 'create' ? 0 : null,
  valorInventarioPosteriorCentavos: request.action === 'create'
    ? inventoryValueCents
    : null,
  motivo: request.action === 'create' ? 'alta_inicial' : request.action,
  referencia: ''
});

// Construye un movimiento manual de existencias
export const buildCabinStockMovement = ({
  actorUid,
  nextInventoryValueCents,
  nextStockScaled,
  previousInventoryValueCents,
  previousStockScaled,
  request,
  requestHash,
  response,
  supply,
  timestamp
}) => ({
  ...buildOperationFields({
    actorUid,
    request,
    requestHash,
    response,
    timestamp
  }),
  insumoNombre: supply.name,
  tipo: request.type,
  accion: request.action,
  unidad: supply.unit,
  cantidadEscalada: request.quantityScaled,
  cambioExistenciasEscalado: nextStockScaled - previousStockScaled,
  existenciasAnterioresEscaladas: previousStockScaled,
  existenciasPosterioresEscaladas: nextStockScaled,
  costoTotalCentavos: request.totalCostCents,
  valorRetiradoCentavos: nextStockScaled < previousStockScaled
    ? previousInventoryValueCents - nextInventoryValueCents
    : 0,
  valorInventarioAnteriorCentavos: previousInventoryValueCents,
  valorInventarioPosteriorCentavos: nextInventoryValueCents,
  motivo: request.reason,
  referencia: request.reference
});
