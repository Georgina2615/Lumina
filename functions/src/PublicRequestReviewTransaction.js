import { FieldValue } from 'firebase-admin/firestore';
import {
  buildAppointmentClientDocument,
  buildAppointmentIdentityDocument
} from './AppointmentDocuments.js';
import { requireStoredIdentity } from './AppointmentClientPolicy.js';
import {
  requireAppointmentActor,
  requireAppointmentService,
  requireAvailableSlot,
  resolveAppointmentClientId
} from './AppointmentStoredPolicy.js';
import {
  requireMatchingPublicReservation,
  requireMatchingPublicService,
  requirePendingPublicRequest,
  requirePublicStoredClient
} from './PublicRequestReviewPolicy.js';
import {
  approvePublicRequest,
  rejectPublicRequest
} from './PublicRequestReviewWrites.js';

// Construye las referencias dependientes de la solicitud
const buildReferences = ({ firestore, publicRequest }) => ({
  appointment: firestore.collection('citas').doc(),
  client: firestore.collection('clientes').doc(),
  service: firestore.collection('servicios').doc(publicRequest.serviceId),
  slot: firestore.collection('cupos').doc(publicRequest.slotId),
  reservation: firestore.collection('reservasPublicas').doc(publicRequest.slotId),
  contactLock: firestore.collection('solicitudesCitaPublica')
    .doc('control').collection('contactos').doc(publicRequest.contactKey),
  identities: publicRequest.identities.map((identity) => ({
    identity,
    reference: firestore.collection('identidadesClientes').doc(identity.id)
  }))
});

// Ejecuta la revisión completa dentro de una transacción
export const runPublicRequestReviewTransaction = ({
  actorUid,
  command,
  firestore,
  now = new Date()
}) => firestore.runTransaction(async (transaction) => {
  const actorReference = firestore.collection('usuarios').doc(actorUid);
  const requestReference = firestore.collection('solicitudesCitaPublica')
    .doc(command.requestId);
  const [actorSnapshot, requestSnapshot] = await transaction.getAll(
    actorReference,
    requestReference
  );
  requireAppointmentActor(actorSnapshot);

  const publicRequest = requirePendingPublicRequest({
    snapshot: requestSnapshot,
    now,
    requestId: command.requestId,
    enforceMinimumNotice: command.action === 'approve'
  });
  if (publicRequest.alreadyProcessed) {
    return {
      requestId: command.requestId,
      status: publicRequest.status,
      appointmentId: publicRequest.appointmentId,
      clientId: publicRequest.clientId,
      alreadyProcessed: true
    };
  }

  const references = buildReferences({ firestore, publicRequest });
  const snapshots = await transaction.getAll(
    references.service,
    references.slot,
    references.reservation,
    references.contactLock,
    ...references.identities.map(({ reference }) => reference)
  );
  const [serviceSnapshot, slotSnapshot, reservationSnapshot, lockSnapshot, ...identitySnapshots] = snapshots;

  if (command.action === 'reject') {
    return rejectPublicRequest({
      actorUid,
      command,
      requestReference,
      transaction,
      references,
      lockSnapshot,
      reservationSnapshot
    });
  }

  const service = requireAppointmentService(serviceSnapshot);
  requireMatchingPublicService({
    service,
    stored: publicRequest.serviceSnapshot
  });
  requireAvailableSlot(slotSnapshot);
  requireMatchingPublicReservation({
    snapshot: reservationSnapshot,
    requestId: command.requestId,
    slotId: publicRequest.slotId
  });

  const identityOwners = identitySnapshots.map((snapshot, index) => (
    requireStoredIdentity({
      snapshot,
      identity: references.identities[index].identity
    })
  ));
  const existingClientId = resolveAppointmentClientId({
    requestedClientId: null,
    identityOwners
  });
  const clientReference = existingClientId
    ? firestore.collection('clientes').doc(existingClientId)
    : references.client;
  const clientSnapshot = existingClientId
    ? await transaction.get(clientReference)
    : null;
  const client = existingClientId
    ? requirePublicStoredClient({
      snapshot: clientSnapshot,
      requestedClient: publicRequest.client
    })
    : publicRequest.client;
  const timestamp = FieldValue.serverTimestamp();

  if (!existingClientId) {
    transaction.create(clientReference, buildAppointmentClientDocument({
      actorUid,
      client,
      timestamp
    }));
  }
  references.identities.forEach(({ identity, reference }, index) => {
    if (!identityOwners[index]) {
      transaction.create(reference, buildAppointmentIdentityDocument({
        actorUid,
        clientId: clientReference.id,
        identity,
        timestamp
      }));
    }
  });

  return approvePublicRequest({
    actorUid,
    client,
    clientReference,
    command,
    firestore,
    lockSnapshot,
    publicRequest,
    references,
    reservationSnapshot,
    service,
    transaction
  });
});
