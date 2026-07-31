import { FieldValue } from 'firebase-admin/firestore';
import {
  buildRetailSku,
  buildVersionedRetailImageUrl
} from './RetailInventoryCalculations.js';
import {
  buildPrivateProductCostDocument,
  buildRetailManagementMovement,
  buildRetailProductDocument,
  buildRetailProductPatch,
  buildRetailProductResponse,
  buildRetailProductUpdate
} from './RetailInventoryDocuments.js';
import {
  mapExistingRetailOperation,
  requireAvailableProductCreation,
  requireManagedRetailProduct,
  requireRetailAdmin
} from './RetailInventoryStoredPolicy.js';

// Resuelve los valores públicos posteriores
const buildNextResponse = ({ image, product, request }) => {
  const revision = request.action === 'create'
    ? 1
    : request.expectedRevision + 1;
  return buildRetailProductResponse({
    action: request.action,
    active: request.action === 'set_active'
      ? request.active
      : request.action === 'create'
        ? true
        : product.data.activo !== false,
    imageUrl: request.action === 'attach_image'
      ? image.url
      : request.action === 'create'
        ? ''
        : typeof product.data.imagenUrl === 'string'
          ? product.data.imagenUrl
          : '',
    operationId: request.operationId,
    productId: request.productId,
    revision,
    sku: request.action === 'create'
      ? buildRetailSku(request.productId)
      : typeof product.data.sku === 'string' && product.data.sku
        ? product.data.sku
        : buildRetailSku(request.productId)
  });
};

// Ejecuta la administración de un producto
export const runManageRetailProductTransaction = async ({
  actorUid,
  firestore,
  image = null,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const productReference = firestore.collection('productos').doc(
    request.productId
  );
  const costReference = firestore.collection('costosProductos').doc(
    request.productId
  );
  const movementReference = firestore.collection('movimientosInventario').doc(
    request.operationId
  );
  return firestore.runTransaction(async (transaction) => {
    const [
      actorSnapshot,
      movementSnapshot,
      productSnapshot,
      costSnapshot
    ] = await transaction.getAll(
      actorReference,
      movementReference,
      productReference,
      costReference
    );
    requireRetailAdmin(actorSnapshot);
    const existing = mapExistingRetailOperation({
      snapshot: movementSnapshot,
      actorUid,
      productId: request.productId,
      requestHash
    });
    if (existing) {
      return existing;
    }
    const timestamp = serverTimestamp();
    if (request.action === 'create') {
      requireAvailableProductCreation({ productSnapshot, costSnapshot });
      const response = buildNextResponse({ image, product: null, request });
      transaction.create(productReference, buildRetailProductDocument({
        actorUid,
        request,
        timestamp
      }));
      transaction.create(costReference, buildPrivateProductCostDocument({
        actorUid,
        averageCostCents: request.unitCostCents,
        productId: request.productId,
        timestamp
      }));
      transaction.create(movementReference, buildRetailManagementMovement({
        actorUid,
        productName: request.name,
        request,
        requestHash,
        response,
        timestamp
      }));
      return response;
    }
    const product = requireManagedRetailProduct(
      productSnapshot,
      request.expectedRevision
    );
    const nextImage = request.action === 'attach_image'
      ? {
        ...image,
        url: buildVersionedRetailImageUrl(
          image.url,
          request.expectedRevision + 1
        )
      }
      : image;
    const response = buildNextResponse({
      image: nextImage,
      product,
      request
    });
    const update = request.action === 'update'
      ? buildRetailProductUpdate({
        actorUid,
        product: product.data,
        request,
        timestamp
      })
      : buildRetailProductPatch({
        actorUid,
        image: nextImage,
        product: product.data,
        request,
        timestamp
      });
    transaction.update(productReference, update);
    transaction.create(movementReference, buildRetailManagementMovement({
      actorUid,
      productName: request.action === 'update' ? request.name : product.name,
      request,
      requestHash,
      response,
      timestamp
    }));
    return response;
  });
};
