import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
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
  getClientIdentityReference,
  normalizeEmail,
  normalizePhone
} from './ClientService';

// Comparte la política usada por la interfaz
export {
  BOOKING_BLOCK_MINUTES,
  BOOKING_TIMES,
  buildAppointmentSlotId,
  getBusinessDateKey,
  validateBookingSchedule
} from './AppointmentBookingPolicy';

const normalizeFullName = (fullName) => {
  const value = String(fullName ?? '').trim().replace(/\s+/g, ' ');
  if (value.length < 2 || value.length > 150) {
    throw new Error('Escribe el nombre completo del cliente');
  }
  return value;
};

const requireActorUid = (actorUid) => {
  if (!actorUid) {
    throw new Error('No se pudo identificar a la persona responsable');
  }
};

// Convierte el servicio al contrato de interfaz
const mapService = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    name: data.nombre,
    priceCents: data.precioCentavos,
    serviceDurationMinutes: data.duracionServicioMinutos,
    preparationMinutes: data.tiempoPreparacionMinutos,
    blockDurationMinutes: data.duracionBloqueMinutos,
    depositPercentage: data.porcentajeAnticipo,
    order: data.orden
  };
};

const mapSlot = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    appointmentId: data.citaId,
    clientId: data.clienteId,
    dateKey: data.fecha,
    time: data.hora,
    start: data.inicio?.toDate?.() ?? null,
    blockEnd: data.finBloque?.toDate?.() ?? null,
    blockDurationMinutes: data.duracionBloqueMinutos
  };
};

// Valida el servicio como fuente canónica
const requireService = (snapshot) => {
  if (!snapshot.exists() || snapshot.data().activo !== true) {
    throw new Error('El servicio ya no está disponible');
  }
  const data = snapshot.data();
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
  return {
    name: data.nombre.trim(),
    priceCents: data.precioCentavos,
    serviceDurationMinutes: data.duracionServicioMinutos,
    preparationMinutes: data.tiempoPreparacionMinutos,
    blockDurationMinutes: data.duracionBloqueMinutos,
    depositPercentage: data.porcentajeAnticipo
  };
};

// Escucha el catálogo operativo
export const subscribeActiveServices = ({ onData, onError }) => (
  onSnapshot(
    query(collection(db, 'servicios'), where('activo', '==', true)),
    (snapshot) => onData(snapshot.docs.map(mapService).sort(
      (first, second) => (
        first.order - second.order
        || first.name.localeCompare(second.name, 'es')
      )
    )),
    onError
  )
);

// Escucha los cupos ocupados de una fecha
export const subscribeSlotsByDate = ({ dateKey, onData, onError }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateKey ?? ''))) {
    throw new Error('La fecha no es válida');
  }
  return onSnapshot(
    query(collection(db, 'cupos'), where('fecha', '==', dateKey)),
    (snapshot) => onData(snapshot.docs.map(mapSlot)),
    onError
  );
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
  const interval = validateBookingSchedule({ dateKey, time });
  if (!serviceId) {
    throw new Error('Selecciona un servicio');
  }
  const appointmentReference = doc(collection(db, 'citas'));
  const clientReference = client?.id
    ? doc(db, 'clientes', client.id)
    : doc(collection(db, 'clientes'));
  const serviceReference = doc(db, 'servicios', serviceId);
  const slotId = buildAppointmentSlotId({ dateKey, time });
  const slotReference = doc(db, 'cupos', slotId);
  const newClient = client?.id ? null : {
    fullName: normalizeFullName(client?.fullName),
    phone: normalizePhone(client?.phone),
    email: normalizeEmail(client?.email)
  };

  return runTransaction(db, async (transaction) => {
    validateBookingSchedule({ dateKey, time });
    const serviceSnapshot = await transaction.get(serviceReference);
    const slotSnapshot = await transaction.get(slotReference);
    const clientSnapshot = client?.id
      ? await transaction.get(clientReference)
      : null;
    const service = requireService(serviceSnapshot);
    if (slotSnapshot.exists()) {
      throw new Error('El horario acaba de ser ocupado');
    }
    if (
      clientSnapshot
      && (!clientSnapshot.exists() || clientSnapshot.data().fusionado === true)
    ) {
      throw new Error('El cliente ya no está disponible');
    }
    const storedClient = clientSnapshot?.data();
    const clientData = newClient ?? {
      fullName: normalizeFullName(storedClient.nombreCompleto),
      phone: normalizePhone(
        storedClient.telefonoNormalizado || storedClient.telefono
      ),
      email: normalizeEmail(
        Object.hasOwn(storedClient, 'emailNormalizado')
          ? storedClient.emailNormalizado
          : storedClient.email
      )
    };
    const identities = [{
      type: 'telefono',
      value: clientData.phone,
      reference: getClientIdentityReference('telefono', clientData.phone)
    }];
    if (clientData.email) {
      identities.push({
        type: 'correo',
        value: clientData.email,
        reference: getClientIdentityReference('correo', clientData.email)
      });
    }
    const identitySnapshots = await Promise.all(
      identities.map(({ reference }) => transaction.get(reference))
    );
    identitySnapshots.forEach((snapshot, index) => {
      if (
        snapshot.exists()
        && snapshot.data().clienteId !== clientReference.id
      ) {
        const label = identities[index].type === 'correo'
          ? 'correo'
          : 'teléfono';
        throw new Error(`El ${label} ya pertenece a otro cliente`);
      }
      if (clientSnapshot && !snapshot.exists()) {
        throw new Error('La identidad del cliente requiere migración');
      }
    });
    const depositData = normalizeDeposit({
      deposit,
      priceCents: service.priceCents,
      percentage: service.depositPercentage
    });

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
    identities.forEach((identity, index) => {
      if (!clientSnapshot && !identitySnapshots[index].exists()) {
        transaction.set(identity.reference, buildClientIdentityData({
          clientId: clientReference.id,
          type: identity.type,
          value: identity.value,
          actorUid
        }));
      }
    });
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
      schemaVersion: 2
    });
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
      schemaVersion: 2
    });
    return {
      appointmentId: appointmentReference.id,
      clientId: clientReference.id,
      slotId
    };
  });
};
