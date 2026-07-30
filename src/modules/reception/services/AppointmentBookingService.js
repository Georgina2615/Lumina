import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import {
  buildBookingIdentityValues,
  normalizeNewBookingClient,
  normalizeStoredBookingClient
} from './AppointmentClientPolicy';
import {
  BOOKING_BLOCK_MINUTES,
  DEPOSIT_PERCENTAGE,
  normalizeDeposit,
  PREPARATION_MINUTES,
  SERVICE_DURATION_MINUTES,
  buildAppointmentSlotId,
  validateBookingSchedule
} from './AppointmentBookingPolicy';
import {
  buildClientIdentityData,
  getClientIdentityReference
} from './ClientService';
import { buildDepositPaymentData } from './PaymentPolicy';

// Comparte la política usada por la interfaz
export {
  BOOKING_BLOCK_MINUTES,
  BOOKING_TIMES,
  buildAppointmentSlotId,
  getBusinessDateKey,
  validateBookingSchedule
} from './AppointmentBookingPolicy';
export {
  subscribeActiveServices,
  subscribeSlotsByDate
} from './AppointmentCatalogService';

// Exige la identidad operativa
const requireActorUid = (actorUid) => {
  // Detiene operaciones anónimas
  if (!actorUid) {
    throw new Error('No se pudo identificar a la persona responsable');
  }
};

// Valida el servicio como fuente canónica
const requireService = (snapshot) => {
  // Detiene servicios ausentes o inactivos
  if (!snapshot.exists() || snapshot.data().activo !== true) {
    throw new Error('El servicio ya no está disponible');
  }
  // Obtiene la configuración vigente
  const data = snapshot.data();
  // Detiene configuraciones incompatibles
  if (
    typeof data.nombre !== 'string'
    || !data.nombre.trim()
    || !Number.isSafeInteger(data.precioCentavos)
    || data.precioCentavos <= 0
    || data.duracionServicioMinutos !== SERVICE_DURATION_MINUTES
    || data.tiempoPreparacionMinutos !== PREPARATION_MINUTES
    || data.duracionBloqueMinutos !== BOOKING_BLOCK_MINUTES
    || data.porcentajeAnticipo !== DEPOSIT_PERCENTAGE
  ) {
    throw new Error('El servicio no tiene una configuración válida');
  }
  // Devuelve la configuración canónica
  return {
    name: data.nombre.trim(),
    priceCents: data.precioCentavos,
    serviceDurationMinutes: data.duracionServicioMinutos,
    preparationMinutes: data.tiempoPreparacionMinutos,
    blockDurationMinutes: data.duracionBloqueMinutos,
    depositPercentage: data.porcentajeAnticipo
  };
};

// Crea cliente cita cupo e identidades en una transacción
export const createAppointmentBooking = async ({
  actorUid,
  client,
  serviceId,
  dateKey,
  time,
  deposit
}) => {
  requireActorUid(actorUid);
  // Valida el intervalo solicitado
  const interval = validateBookingSchedule({ dateKey, time });
  // Detiene reservas sin servicio
  if (!serviceId) {
    throw new Error('Selecciona un servicio');
  }
  // Construye la referencia de la cita
  const appointmentReference = doc(collection(db, 'citas'));
  // Construye la referencia del cliente
  const clientReference = client?.id
    ? doc(db, 'clientes', client.id)
    : doc(collection(db, 'clientes'));
  // Construye la referencia del servicio
  const serviceReference = doc(db, 'servicios', serviceId);
  // Construye la identidad del cupo
  const slotId = buildAppointmentSlotId({ dateKey, time });
  // Construye la referencia del cupo
  const slotReference = doc(db, 'cupos', slotId);
  // Normaliza únicamente clientes nuevos
  const newClient = client?.id
    ? null
    : normalizeNewBookingClient(client);

  // Ejecuta toda la reserva de forma atómica
  return runTransaction(db, async (transaction) => {
    validateBookingSchedule({ dateKey, time });
    // Lee el servicio vigente
    const serviceSnapshot = await transaction.get(serviceReference);
    // Lee la disponibilidad vigente
    const slotSnapshot = await transaction.get(slotReference);
    // Lee el cliente existente cuando corresponde
    const clientSnapshot = client?.id
      ? await transaction.get(clientReference)
      : null;
    // Obtiene el servicio validado
    const service = requireService(serviceSnapshot);
    // Detiene cupos ocupados
    if (slotSnapshot.exists()) {
      throw new Error('El horario acaba de ser ocupado');
    }
    // Detiene clientes ausentes o fusionados
    if (
      clientSnapshot
      && (!clientSnapshot.exists() || clientSnapshot.data().fusionado === true)
    ) {
      throw new Error('El cliente ya no está disponible');
    }
    // Construye el cliente canónico
    const clientData = newClient
      ?? normalizeStoredBookingClient(clientSnapshot.data());
    // Construye las identidades requeridas
    const identities = buildBookingIdentityValues(clientData).map(
      (identity) => ({
        ...identity,
        reference: getClientIdentityReference(
          identity.type,
          identity.value
        )
      })
    );
    // Lee las identidades dentro de la transacción
    const identitySnapshots = await Promise.all(
      identities.map(({ reference }) => transaction.get(reference))
    );
    identitySnapshots.forEach((snapshot, index) => {
      // Detiene identidades pertenecientes a otro cliente
      if (
        snapshot.exists()
        && snapshot.data().clienteId !== clientReference.id
      ) {
        const label = identities[index].type === 'correo'
          ? 'correo'
          : 'teléfono';
        throw new Error(`El ${label} ya pertenece a otro cliente`);
      }
      // Detiene clientes heredados sin identidad reparada
      if (clientSnapshot && !snapshot.exists()) {
        throw new Error('La identidad del cliente requiere migración');
      }
    });
    // Normaliza el anticipo requerido
    const depositData = normalizeDeposit({
      deposit,
      priceCents: service.priceCents,
      percentage: service.depositPercentage
    });
    // Construye la referencia financiera determinista
    const depositPaymentReference = doc(
      db,
      'pagos',
      `${appointmentReference.id}_anticipo`
    );

    // Crea el cliente únicamente cuando es nuevo
    if (!clientSnapshot) {
      transaction.set(clientReference, {
        nombreCompleto: clientData.fullName,
        telefono: clientData.phone,
        telefonoNormalizado: clientData.phone,
        email: clientData.email ?? '',
        emailNormalizado: clientData.email ?? '',
        consentimientoFirmado: false,
        fusionado: false,
        fechaRegistro: serverTimestamp(),
        creadoPor: actorUid
      });
    }
    // Crea las identidades faltantes del cliente nuevo
    identities.forEach((identity, index) => {
      // Evita sobrescribir identidades existentes
      if (!clientSnapshot && !identitySnapshots[index].exists()) {
        transaction.set(identity.reference, buildClientIdentityData({
          clientId: clientReference.id,
          type: identity.type,
          value: identity.value,
          actorUid
        }));
      }
    });
    // Crea la cita con importes congelados
    transaction.set(appointmentReference, {
      clienteId: clientReference.id,
      nombreCompleto: clientData.fullName,
      servicioId: serviceId,
      servicio: service.name,
      precioServicioCentavos: service.priceCents,
      precioServicio: service.priceCents / 100,
      duracionServicioMinutos: service.serviceDurationMinutes,
      tiempoPreparacionMinutos: service.preparationMinutes,
      duracionBloqueMinutos: service.blockDurationMinutes,
      duracionMinutos: service.blockDurationMinutes,
      fecha: dateKey,
      hora: time,
      inicio: Timestamp.fromDate(interval.start),
      finTratamiento: Timestamp.fromDate(interval.treatmentEnd),
      finBloque: Timestamp.fromDate(interval.blockEnd),
      cupoId: slotId,
      estado: 'confirmada',
      anticipoPagado: true,
      anticipoPorcentaje: service.depositPercentage,
      anticipoMontoCentavos: depositData.amountCents,
      anticipoMetodo: depositData.method,
      anticipoPagos: depositData.payments,
      recordatorioEnviado: false,
      creadaEn: serverTimestamp(),
      creadaPor: actorUid,
      schemaVersion: 3
    });
    // Ocupa el horario de forma exclusiva
    transaction.set(slotReference, {
      citaId: appointmentReference.id,
      clienteId: clientReference.id,
      fecha: dateKey,
      hora: time,
      inicio: Timestamp.fromDate(interval.start),
      finBloque: Timestamp.fromDate(interval.blockEnd),
      duracionBloqueMinutos: service.blockDurationMinutes,
      creadoEn: serverTimestamp(),
      creadoPor: actorUid,
      schemaVersion: 3
    });
    // Registra el anticipo con todas sus partes
    transaction.set(
      depositPaymentReference,
      buildDepositPaymentData({
        actorUid,
        appointmentId: appointmentReference.id,
        clientId: clientReference.id,
        deposit: depositData,
        timestamp: serverTimestamp()
      })
    );

    // Devuelve las identidades creadas
    return {
      appointmentId: appointmentReference.id,
      clientId: clientReference.id,
      slotId
    };
  });
};
