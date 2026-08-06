import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';
import {
  buildAppointmentSlotDocument
} from './AppointmentDocuments.js';
import {
  buildAdditionalDepositDocument,
  buildReprogrammedAppointment,
  buildReprogramResponse,
  buildSourceReprogramEvent,
  buildSourceReprogramUpdate
} from './ReprogramAppointmentDocuments.js';
import {
  requireAdditionalDeposit,
  requireSourcePayments
} from './ReprogramAppointmentPaymentPolicy.js';
import {
  buildAppointmentSlotId
} from './AppointmentSchedulePolicy.js';
import {
  requireExistingReprogramDestination,
  requireReprogramClient,
  requireReprogramNotice,
  requireReprogramSource
} from './ReprogramAppointmentStoredPolicy.js';
import {
  requireAppointmentActor,
  requireAppointmentService,
  requireAvailableSlot
} from './AppointmentStoredPolicy.js';

// Construye referencias estables fuera de los reintentos
const buildReferences = ({
  actorUid,
  firestore,
  request
}) => {
  // Identifica el nuevo destino
  const destination = firestore.collection('citas').doc();

  // Identifica el horario exclusivo
  const slotId = buildAppointmentSlotId(request);

  // Devuelve las referencias compartidas
  return {
    actor: firestore.collection('usuarios').doc(actorUid),
    destination,
    source: firestore
      .collection('citas')
      .doc(request.sourceAppointmentId),
    slotId,
    slot: firestore.collection('cupos').doc(slotId),
    publicReservation: firestore.collection('reservasPublicas').doc(slotId),
    service: firestore.collection('servicios').doc(request.serviceId),
    additionalPayment: firestore
      .collection('pagos')
      .doc(`${destination.id}_anticipo_adicional`),
    event: firestore
      .collection(`citas/${request.sourceAppointmentId}/eventos`)
      .doc('reprogramada')
  };
};

// Construye la respuesta de un reintento válido
const buildRetryResponse = ({
  destination,
  destinationId
}) => buildReprogramResponse({
  additionalCents: destination.anticipoAdicionalCentavos,
  alreadyProcessed: true,
  clientId: destination.clienteId,
  creditCents: destination.creditoReprogramacionCentavos,
  destinationId,
  paymentIds: destination.pagosAnticipoIds,
  slotId: destination.cupoId
});

// Ejecuta la reprogramación de forma atómica
export const runReprogramAppointmentTransaction = async ({
  actorUid,
  firestore,
  now = new Date(),
  request,
  serverTimestamp = FieldValue.serverTimestamp,
  toTimestamp = Timestamp.fromDate
}) => {
  // Construye identidades que sobreviven reintentos
  const references = buildReferences({
    actorUid,
    firestore,
    request
  });

  // Ejecuta todas las decisiones financieras juntas
  return firestore.runTransaction(async (transaction) => {
    // Lee actor y cita de origen
    const [
      actorSnapshot,
      sourceSnapshot
    ] = await transaction.getAll(
      references.actor,
      references.source
    );

    requireAppointmentActor(actorSnapshot);

    // Verifica la disponibilidad del crédito
    const sourceContext = requireReprogramSource({
      snapshot: sourceSnapshot,
      sourceAppointmentId: request.sourceAppointmentId
    });

    // Resuelve reintentos sin volver a consumir pagos
    if (sourceContext.isRetry) {
      const destinationReference = firestore
        .collection('citas')
        .doc(sourceContext.destinationId);
      const destinationSnapshot = await transaction.get(
        destinationReference
      );
      const destination = requireExistingReprogramDestination({
        request,
        snapshot: destinationSnapshot,
        source: sourceContext.source,
        sourceAppointmentId: request.sourceAppointmentId
      });

      return buildRetryResponse({
        destination,
        destinationId: sourceContext.destinationId
      });
    }

    requireReprogramNotice({
      interval: request.interval,
      now
    });

    // Identifica cliente y pagos originales
    const clientReference = firestore
      .collection('clientes')
      .doc(sourceContext.source.clienteId);
    const paymentReferences = sourceContext.paymentIds.map(
      (paymentId) => firestore.collection('pagos').doc(paymentId)
    );

    // Lee servicio cupo cliente y pagos
    const remainingSnapshots = await transaction.getAll(
      references.service,
      references.slot,
      references.publicReservation,
      clientReference,
      ...paymentReferences
    );
    const [
      serviceSnapshot,
      slotSnapshot,
      publicReservationSnapshot,
      clientSnapshot,
      ...paymentSnapshots
    ] = remainingSnapshots;

    // Verifica el nuevo destino
    const service = requireAppointmentService(serviceSnapshot);
    requireAvailableSlot(slotSnapshot);
    requireAvailableSlot(publicReservationSnapshot);
    const client = requireReprogramClient({
      snapshot: clientSnapshot
    });

    // Comprueba el crédito contra pagos reales
    const credit = requireSourcePayments({
      paymentIds: sourceContext.paymentIds,
      snapshots: paymentSnapshots,
      source: sourceContext.source,
      sourceAppointmentId: request.sourceAppointmentId
    });
    const deposit = requireAdditionalDeposit({
      additionalDeposit: request.additionalDeposit,
      creditCents: credit.creditCents,
      paymentCount: sourceContext.paymentIds.length,
      service
    });

    // Conserva únicamente movimientos financieros reales
    const paymentIds = deposit.additionalCents > 0
      ? [
        ...sourceContext.paymentIds,
        references.additionalPayment.id
      ]
      : sourceContext.paymentIds;
    const parts = [
      ...credit.parts,
      ...deposit.additionalParts
    ];
    const timestamp = serverTimestamp();

    // Crea la nueva cita pendiente de confirmación
    transaction.create(
      references.destination,
      buildReprogrammedAppointment({
        actorUid,
        additionalCents: deposit.additionalCents,
        client,
        creditCents: credit.creditCents,
        interval: request.interval,
        parts,
        paymentIds,
        requiredCents: deposit.requiredCents,
        service,
        slotId: references.slotId,
        sourceAppointmentId: request.sourceAppointmentId,
        timestamp,
        toTimestamp
      })
    );

    // Ocupa el horario nuevo
    transaction.create(
      references.slot,
      buildAppointmentSlotDocument({
        actorUid,
        appointmentId: references.destination.id,
        clientId: client.id,
        interval: request.interval,
        service,
        timestamp,
        toTimestamp
      })
    );

    // Mueve cada pago original sin duplicarlo
    paymentReferences.forEach((reference) => {
      transaction.update(reference, {
        aplicadaACitaId: references.destination.id,
        aplicadaEn: timestamp,
        aplicadaPor: actorUid
      });
    });

    // Registra solo la diferencia efectivamente cobrada
    if (deposit.additionalCents > 0) {
      transaction.create(
        references.additionalPayment,
        buildAdditionalDepositDocument({
          actorUid,
          additionalDeposit: request.additionalDeposit,
          amountCents: deposit.additionalCents,
          appointmentId: references.destination.id,
          clientId: client.id,
          timestamp
        })
      );
    }

    // Consume la fuente y registra su historia
    transaction.update(
      references.source,
      buildSourceReprogramUpdate({
        actorUid,
        additionalCents: deposit.additionalCents,
        creditCents: credit.creditCents,
        destinationId: references.destination.id,
        request,
        slotId: references.slotId,
        source: sourceContext.source,
        timestamp
      })
    );
    transaction.create(
      references.event,
      buildSourceReprogramEvent({
        actorUid,
        additionalCents: deposit.additionalCents,
        creditCents: credit.creditCents,
        destinationId: references.destination.id,
        request,
        timestamp
      })
    );

    // Devuelve el destino confirmado
    return buildReprogramResponse({
      additionalCents: deposit.additionalCents,
      alreadyProcessed: false,
      clientId: client.id,
      creditCents: credit.creditCents,
      destinationId: references.destination.id,
      paymentIds,
      slotId: references.slotId
    });
  });
};
