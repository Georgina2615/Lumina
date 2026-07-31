import {
  buildRetailSku,
  multiplySafeIntegers
} from './RetailInventoryCalculations.js';

// Define la única sucursal operativa
export const RETAIL_BRANCH_ID = 'principal';

// Define la existencia inicial aprobada
export const INITIAL_RETAIL_STOCK = 30;

// Conserva la auditoría previa o crea una compatible
const buildAudit = ({ actorUid, product, timestamp }) => ({
  creadaEn: product?.auditoria?.creadaEn ?? timestamp,
  creadaPor: typeof product?.auditoria?.creadaPor === 'string'
    ? product.auditoria.creadaPor
    : actorUid,
  actualizadaEn: timestamp,
  actualizadaPor: actorUid
});

// Construye la respuesta pública de una operación
export const buildRetailProductResponse = ({
  action,
  active,
  imageUrl,
  operationId,
  productId,
  revision,
  sku
}) => ({
  action,
  productId,
  operationId,
  revision,
  sku,
  active,
  imageUrl,
  alreadyProcessed: false
});

// Construye un producto nuevo
export const buildRetailProductDocument = ({
  actorUid,
  request,
  timestamp
}) => ({
  schemaVersion: 1,
  nombre: request.name,
  marca: request.brand,
  sku: buildRetailSku(request.productId),
  categoria: request.category,
  descripcion: request.description,
  imagenUrl: '',
  imagenRuta: '',
  precioCentavos: request.priceCents,
  existencias: INITIAL_RETAIL_STOCK,
  stockMinimo: request.minimumStock,
  sucursalId: RETAIL_BRANCH_ID,
  activo: true,
  revision: 1,
  auditoria: buildAudit({ actorUid, product: null, timestamp })
});

// Construye el costo privado de un producto
export const buildPrivateProductCostDocument = ({
  actorUid,
  averageCostCents,
  productId,
  timestamp
}) => ({
  schemaVersion: 1,
  productoId: productId,
  costoPromedioCentavos: averageCostCents,
  sucursalId: RETAIL_BRANCH_ID,
  actualizadaEn: timestamp,
  actualizadaPor: actorUid
});

// Construye la edición completa del catálogo
export const buildRetailProductUpdate = ({
  actorUid,
  product,
  request,
  timestamp
}) => ({
  schemaVersion: 1,
  nombre: request.name,
  marca: request.brand,
  sku: typeof product.sku === 'string' && product.sku
    ? product.sku
    : buildRetailSku(request.productId),
  categoria: request.category,
  descripcion: request.description,
  imagenUrl: typeof product.imagenUrl === 'string' ? product.imagenUrl : '',
  imagenRuta: typeof product.imagenRuta === 'string' ? product.imagenRuta : '',
  precioCentavos: request.priceCents,
  stockMinimo: request.minimumStock,
  sucursalId: RETAIL_BRANCH_ID,
  activo: product.activo !== false,
  revision: request.expectedRevision + 1,
  auditoria: buildAudit({ actorUid, product, timestamp })
});

// Construye una actualización de estado o imagen
export const buildRetailProductPatch = ({
  actorUid,
  image,
  product,
  request,
  timestamp
}) => ({
  ...(request.action === 'set_active' ? { activo: request.active } : {}),
  ...(request.action === 'attach_image' ? {
    imagenUrl: image.url,
    imagenRuta: image.path
  } : {}),
  sku: typeof product.sku === 'string' && product.sku
    ? product.sku
    : buildRetailSku(request.productId),
  sucursalId: RETAIL_BRANCH_ID,
  revision: request.expectedRevision + 1,
  auditoria: buildAudit({ actorUid, product, timestamp })
});

// Construye una actualización de existencias
export const buildRetailStockPatch = ({
  actorUid,
  currentStock,
  product,
  revision,
  timestamp
}) => ({
  existencias: currentStock,
  revision,
  sucursalId: RETAIL_BRANCH_ID,
  auditoria: buildAudit({ actorUid, product, timestamp })
});

// Construye el registro idempotente de una operación
const buildOperationFields = ({
  actorUid,
  operationId,
  productId,
  requestHash,
  response,
  timestamp
}) => ({
  productoId: productId,
  sucursalId: RETAIL_BRANCH_ID,
  fecha: timestamp,
  actorUid,
  idempotencia: {
    clave: operationId,
    hashSolicitud: requestHash
  },
  resultado: response,
  schemaVersion: 1
});

// Construye un movimiento de administración
export const buildRetailManagementMovement = ({
  actorUid,
  productName,
  request,
  requestHash,
  response,
  timestamp
}) => ({
  ...buildOperationFields({
    actorUid,
    operationId: request.operationId,
    productId: request.productId,
    requestHash,
    response,
    timestamp
  }),
  productoNombre: productName,
  tipo: request.action === 'create' ? 'entrada_inicial' : 'gestion_producto',
  accion: request.action,
  cantidad: request.action === 'create' ? INITIAL_RETAIL_STOCK : 0,
  cambioExistencias: request.action === 'create' ? INITIAL_RETAIL_STOCK : 0,
  existenciasAnteriores: request.action === 'create' ? 0 : null,
  existenciasPosteriores: request.action === 'create'
    ? INITIAL_RETAIL_STOCK
    : null,
  costoUnitarioCentavos: request.action === 'create'
    ? request.unitCostCents
    : null,
  costoTotalCentavos: request.action === 'create'
    ? multiplySafeIntegers(request.unitCostCents, INITIAL_RETAIL_STOCK)
    : null,
  motivo: request.action === 'create' ? 'alta_inicial' : request.action,
  referencia: ''
});

// Construye un movimiento manual de existencias
export const buildRetailStockMovement = ({
  actorUid,
  averageCostCents,
  currentStock,
  movementCostCents,
  previousStock,
  productName,
  request,
  requestHash,
  response,
  timestamp
}) => ({
  ...buildOperationFields({
    actorUid,
    operationId: request.operationId,
    productId: request.productId,
    requestHash,
    response,
    timestamp
  }),
  productoNombre: productName,
  tipo: request.type,
  cantidad: request.quantity,
  cambioExistencias: currentStock - previousStock,
  existenciasAnteriores: previousStock,
  existenciasPosteriores: currentStock,
  costoUnitarioCentavos: movementCostCents,
  costoTotalCentavos: movementCostCents === null
    ? null
    : multiplySafeIntegers(movementCostCents, request.quantity),
  costoPromedioPosteriorCentavos: averageCostCents,
  motivo: request.reason,
  referencia: request.reference
});
