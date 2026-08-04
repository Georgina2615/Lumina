import { FieldValue } from 'firebase-admin/firestore';
import {
  buildServiceCatalogResponse,
  buildServiceChangeDocument,
  buildServiceDocument,
  buildServiceStatePatch,
  buildServiceUpdate
} from './ServiceCatalogDocuments.js';
import {
  mapExistingServiceOperation,
  requireAvailableServiceCreation,
  requireServiceCanActivate,
  requireServiceCatalogAdmin,
  requireStoredService,
  requireUniqueServiceName,
  resolveServiceOrder
} from './ServiceCatalogStoredPolicy.js';

// Ejecuta la administracion segura de servicios
export const runManageServiceCatalogTransaction = async ({
  actorUid,
  firestore,
  request,
  requestHash,
  serverTimestamp = FieldValue.serverTimestamp
}) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const serviceReference = firestore
    .collection('servicios')
    .doc(request.serviceId);
  const operationReference = firestore
    .collection('cambiosServicios')
    .doc(request.operationId);

  return firestore.runTransaction(async (transaction) => {
    const [
      actorSnapshot,
      operationSnapshot,
      serviceSnapshot
    ] = await transaction.getAll(
      actorReference,
      operationReference,
      serviceReference
    );

    requireServiceCatalogAdmin(actorSnapshot);

    const existingOperation = mapExistingServiceOperation({
      actorUid,
      operationSnapshot,
      requestHash,
      serviceId: request.serviceId
    });

    if (existingOperation) {
      return existingOperation;
    }

    const timestamp = serverTimestamp();
    let previousRevision = 0;
    let previousService = null;
    let nextService;
    let response;

    if (request.action === 'create') {
      requireAvailableServiceCreation(serviceSnapshot);
      const catalogSnapshot = await transaction.get(
        firestore.collection('servicios')
      );
      requireUniqueServiceName({
        catalogSnapshot,
        name: request.name,
        serviceId: request.serviceId
      });
      const order = resolveServiceOrder({
        catalogSnapshot,
        serviceId: request.serviceId
      });
      response = buildServiceCatalogResponse({
        active: false,
        operationId: request.operationId,
        revision: 1,
        serviceId: request.serviceId
      });
      nextService = buildServiceDocument({ order, request });
      transaction.create(serviceReference, nextService);
    } else {
      const storedService = requireStoredService(
        serviceSnapshot,
        request.expectedRevision
      );
      previousRevision = storedService.revision;
      previousService = storedService.data;
      const nextRevision = previousRevision + 1;
      const nextActive = request.action === 'set_active'
        ? request.active
        : storedService.data.activo === true;

      if (request.action === 'set_active' && request.active) {
        requireServiceCanActivate(storedService.data);
      }

      if (request.action === 'update') {
        const catalogSnapshot = await transaction.get(
          firestore.collection('servicios')
        );
        requireUniqueServiceName({
          catalogSnapshot,
          name: request.name,
          serviceId: request.serviceId
        });
        const order = resolveServiceOrder({
          catalogSnapshot,
          serviceId: request.serviceId,
          storedOrder: storedService.data.orden
        });
        const serviceUpdate = buildServiceUpdate({
          order,
          request,
          revision: nextRevision
        });
        nextService = { ...storedService.data, ...serviceUpdate };
        transaction.update(serviceReference, serviceUpdate);
      } else {
        const statePatch = buildServiceStatePatch({
          active: request.active,
          revision: nextRevision
        });
        nextService = { ...storedService.data, ...statePatch };
        transaction.update(serviceReference, statePatch);
      }

      response = buildServiceCatalogResponse({
        active: nextActive,
        operationId: request.operationId,
        revision: nextRevision,
        serviceId: request.serviceId
      });
    }

    transaction.create(operationReference, buildServiceChangeDocument({
      actorUid,
      nextService,
      previousRevision,
      previousService,
      request,
      requestHash,
      response,
      timestamp
    }));

    return response;
  });
};
