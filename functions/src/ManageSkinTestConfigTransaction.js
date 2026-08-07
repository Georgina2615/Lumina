import { FieldValue } from 'firebase-admin/firestore';
import {
  buildSkinTestConfigChange,
  buildSkinTestConfigDocument
} from './SkinTestConfigDocuments.js';
import {
  mapExistingSkinTestOperation,
  requireSkinTestAdmin,
  requireSkinTestCatalog,
  requireSkinTestRevision
} from './SkinTestConfigStoredPolicy.js';

// Guarda la configuración y su historial en una transacción
export const runManageSkinTestConfigTransaction = ({
  actorUid,
  firestore,
  hash,
  request,
  serverTimestamp = FieldValue.serverTimestamp
}) => firestore.runTransaction(async (transaction) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const configReference = firestore.collection('configuracionTestPiel').doc('principal');
  const operationReference = firestore.collection('cambiosTestPiel').doc(request.operationId);
  const [actorSnapshot, configSnapshot, operationSnapshot] = await transaction.getAll(
    actorReference,
    configReference,
    operationReference
  );
  requireSkinTestAdmin(actorSnapshot);
  const existing = mapExistingSkinTestOperation({
    actorUid,
    hash,
    snapshot: operationSnapshot
  });
  if (existing) return existing;
  const previous = requireSkinTestRevision(configSnapshot, request.expectedRevision);
  const serviceIds = [...new Set(Object.values(request.results)
    .map(({ serviceId }) => serviceId).filter(Boolean))];
  const productIds = [...new Set(Object.values(request.results)
    .flatMap(({ productIds: ids }) => ids))];
  const catalogReferences = [
    ...serviceIds.map((id) => firestore.collection('servicios').doc(id)),
    ...productIds.map((id) => firestore.collection('productos').doc(id))
  ];
  const catalogSnapshots = catalogReferences.length > 0
    ? await transaction.getAll(...catalogReferences)
    : [];
  requireSkinTestCatalog({
    products: catalogSnapshots.slice(serviceIds.length),
    request,
    services: catalogSnapshots.slice(0, serviceIds.length)
  });
  const timestamp = serverTimestamp();
  const response = {
    active: request.active,
    operationId: request.operationId,
    revision: request.expectedRevision + 1
  };
  const nextDocument = buildSkinTestConfigDocument({ actorUid, request, timestamp });
  if (configSnapshot.exists) transaction.update(configReference, nextDocument);
  else transaction.create(configReference, nextDocument);
  transaction.create(operationReference, buildSkinTestConfigChange({
    actorUid,
    hash,
    previous,
    request,
    response,
    timestamp
  }));
  return response;
});
