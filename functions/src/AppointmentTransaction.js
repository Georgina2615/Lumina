import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';
import {
  buildClientIdentities,
  requireStoredClient,
  requireStoredIdentity
} from './AppointmentClientPolicy.js';
import {
  requireExpectedDeposit
} from './AppointmentDepositPolicy.js';
import {
  buildAppointmentClientDocument,
  buildAppointmentDocument,
  buildAppointmentIdentityDocument,
  buildAppointmentPaymentDocument,
  buildAppointmentSlotDocument
} from './AppointmentDocuments.js';
import {
  buildAppointmentSlotId
} from './AppointmentSchedulePolicy.js';
import {
  requireAppointmentActor,
  requireAppointmentService,
  requireAvailableSlot,
  resolveAppointmentClientId
} from './AppointmentStoredPolicy.js';

// Construye referencias estables fuera de los reintentos
const buildTransactionReferences = ({ firestore, request }) => {
  // Construye la cita con identidad aleatoria
  const appointment = firestore.collection('citas').doc();

  // Construye el posible cliente nuevo
  const newClient = firestore.collection('clientes').doc();

  // Construye la identidad exclusiva del horario
  const slotId = buildAppointmentSlotId(request);

  // Construye las identidades del cliente
  const identities = buildClientIdentities(request.client);

  // Devuelve todas las referencias estables
  return {
    appointment,
    newClient,
    slotId,
    slot: firestore.collection('cupos').doc(slotId),
    service: firestore.collection('servicios').doc(request.serviceId),
    identities: identities.map((identity) => ({
      identity,
      reference: firestore
        .collection('identidadesClientes')
        .doc(identity.id)
    }))
  };
};

// Ejecuta todas las escrituras de la cita en una transacción
export const runAppointmentTransaction = async ({
  actorUid,
  firestore,
  request,
  serverTimestamp = FieldValue.serverTimestamp,
  toTimestamp = Timestamp.fromDate
}) => {
  // Construye referencias que sobreviven a reintentos
  const references = buildTransactionReferences({ firestore, request });

  // Construye la referencia del actor autenticado
  const actorReference = firestore.collection('usuarios').doc(actorUid);

  // Identifica el movimiento financiero
  const payment = firestore
    .collection('pagos')
    .doc(`${references.appointment.id}_anticipo`);

  // Ejecuta la reserva de forma atómica
  return firestore.runTransaction(async (transaction) => {
    // Reúne las lecturas iniciales
    const initialReferences = [
      actorReference,
      references.service,
      references.slot,
      ...references.identities.map(({ reference }) => reference)
    ];

    // Obtiene actor servicio cupo e identidades
    const [
      actorSnapshot,
      serviceSnapshot,
      slotSnapshot,
      ...identitySnapshots
    ] = await transaction.getAll(...initialReferences);

    requireAppointmentActor(actorSnapshot);

    // Obtiene el servicio canónico
    const service = requireAppointmentService(serviceSnapshot);

    requireAvailableSlot(slotSnapshot);

    // Verifica cada identidad persistida
    const identityOwners = identitySnapshots.map(
      (snapshot, index) => requireStoredIdentity({
        snapshot,
        identity: references.identities[index].identity
      })
    );

    // Resuelve el posible cliente existente
    const existingClientId = resolveAppointmentClientId({
      requestedClientId: request.client.id,
      identityOwners
    });

    // Construye la referencia final del cliente
    const clientReference = existingClientId
      ? firestore.collection('clientes').doc(existingClientId)
      : references.newClient;

    // Lee el cliente existente antes de cualquier escritura
    const clientSnapshot = existingClientId
      ? await transaction.get(clientReference)
      : null;

    // Conserva los datos canónicos del cliente
    const client = existingClientId
      ? requireStoredClient({
        snapshot: clientSnapshot,
        requestedClient: request.client,
        identities: references.identities.map(({ identity }) => identity),
        identityOwners
      })
      : request.client;

    // Consolida el anticipo con el precio real
    const deposit = requireExpectedDeposit({
      deposit: request.deposit,
      priceCents: service.priceCents,
      percentage: service.depositPercentage
    });

    // Obtiene una marca temporal única del servidor
    const timestamp = serverTimestamp();

    // Crea el cliente y sus identidades cuando es nuevo
    if (!existingClientId) {
      transaction.create(
        clientReference,
        buildAppointmentClientDocument({
          actorUid,
          client,
          timestamp
        })
      );

      references.identities.forEach(({ identity, reference }) => {
        // Crea cada identidad de manera exclusiva
        transaction.create(
          reference,
          buildAppointmentIdentityDocument({
            actorUid,
            clientId: clientReference.id,
            identity,
            timestamp
          })
        );
      });
    }

    // Crea la cita pendiente de confirmacion
    transaction.create(
      references.appointment,
      buildAppointmentDocument({
        actorUid,
        client,
        clientId: clientReference.id,
        contactChannel: request.contactChannel,
        deposit,
        interval: request.interval,
        service,
        slotId: references.slotId,
        timestamp,
        toTimestamp
      })
    );

    // Ocupa el horario de manera exclusiva
    transaction.create(
      references.slot,
      buildAppointmentSlotDocument({
        actorUid,
        appointmentId: references.appointment.id,
        clientId: clientReference.id,
        interval: request.interval,
        service,
        timestamp,
        toTimestamp
      })
    );

    // Registra el anticipo confirmado
    transaction.create(
      payment,
      buildAppointmentPaymentDocument({
        actorUid,
        appointmentId: references.appointment.id,
        clientId: clientReference.id,
        deposit,
        timestamp
      })
    );

    // Devuelve la reserva creada
    return {
      appointmentId: references.appointment.id,
      clientId: clientReference.id,
      slotId: references.slotId,
      depositAmountCents: deposit.amountCents
    };
  });
};
