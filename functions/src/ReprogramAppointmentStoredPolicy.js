import { AppointmentError } from './AppointmentError.js';
import {
  MINIMUM_NOTICE_MINUTES
} from './AppointmentSchedulePolicy.js';

// Define el máximo de pagos aplicables
const MAX_DEPOSIT_PAYMENTS = 5;

// Lanza un error conocido
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Reconoce identidades documentales
const isDocumentId = (value) => (
  typeof value === 'string'
  && value.length > 0
  && value.length <= 500
  && !value.includes('/')
);

// Reconoce importes monetarios positivos
const isPositiveInteger = (value) => (
  Number.isSafeInteger(value) && value > 0
);

// Reconoce un correo vigente
const isValidEmail = (value) => (
  typeof value === 'string'
  && value.length <= 254
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
);

// Resuelve los pagos reales del anticipo
export const resolveSourcePaymentIds = ({
  source,
  sourceAppointmentId
}) => {
  // Usa el arreglo explícito cuando existe
  if (Object.hasOwn(source, 'pagosAnticipoIds')) {
    const paymentIds = source.pagosAnticipoIds;

    // Detiene contratos incompletos o repetidos
    if (
      !Array.isArray(paymentIds)
      || paymentIds.length < 1
      || paymentIds.length > MAX_DEPOSIT_PAYMENTS
      || paymentIds.some((id) => !isDocumentId(id))
      || new Set(paymentIds).size !== paymentIds.length
    ) {
      fail(
        'failed-precondition',
        'La cita no tiene pagos de anticipo válidos'
      );
    }

    // Devuelve las identidades verificadas
    return paymentIds;
  }

  // Conserva compatibilidad con anticipos heredados
  return [`${sourceAppointmentId}_anticipo`];
};

// Verifica una cita cancelada por la clinica
export const requireReprogramSource = ({
  snapshot,
  sourceAppointmentId
}) => {
  // Detiene citas ausentes
  if (!snapshot.exists) {
    fail('not-found', 'La cita de origen no existe');
  }

  // Obtiene la cita persistida
  const source = snapshot.data();

  // Detiene esquemas incompatibles
  if (
    source.schemaVersion !== 3
    || !isDocumentId(source.clienteId)
    || !isPositiveInteger(source.anticipoMontoCentavos)
  ) {
    fail(
      'failed-precondition',
      'La cita de origen no tiene un formato válido'
    );
  }

  // Detecta una reprogramacion ya aplicada
  if (source.reprogramacion?.estado === 'utilizada') {
    const destinationId = source.reprogramacion.aplicadaACitaId;

    if (!isDocumentId(destinationId)) {
      fail(
        'failed-precondition',
        'La reprogramación anterior no es válida'
      );
    }

    return {
      destinationId,
      isRetry: true,
      paymentIds: resolveSourcePaymentIds({
        source,
        sourceAppointmentId
      }),
      source
    };
  }

  // Exige una cancelacion atribuible a la clinica
  if (
    source.estado !== 'cancelada'
    || source.cancelacion?.origen !== 'clinica'
    || source.cancelacion?.anticipoResultado
      !== 'disponible_reprogramacion'
    || source.cancelacion?.reprogramacionDisponible !== true
    || source.reprogramacion?.estado !== 'disponible'
    || source.reprogramacion.anticipoDisponibleCentavos
      !== source.anticipoMontoCentavos
    || source.anticipoPagado !== true
  ) {
    fail(
      'failed-precondition',
      'La cita no tiene un anticipo disponible para reprogramar'
    );
  }

  // Devuelve la fuente verificada
  return {
    destinationId: null,
    isRetry: false,
    paymentIds: resolveSourcePaymentIds({
      source,
      sourceAppointmentId
    }),
    source
  };
};

// Verifica la anticipación de una nueva reserva
export const requireReprogramNotice = ({
  interval,
  now
}) => {
  // Detiene relojes o intervalos incompatibles
  if (
    !(now instanceof Date)
    || Number.isNaN(now.getTime())
    || !(interval?.start instanceof Date)
    || Number.isNaN(interval.start.getTime())
  ) {
    fail(
      'failed-precondition',
      'No se pudo validar la hora de la reprogramación'
    );
  }

  // Calcula el primer momento disponible
  const minimumStart = (
    now.getTime() + MINIMUM_NOTICE_MINUTES * 60_000
  );

  // Detiene reservas demasiado próximas
  if (interval.start.getTime() < minimumStart) {
    fail(
      'invalid-argument',
      'La cita requiere al menos quince minutos de anticipación'
    );
  }
};

// Obtiene el cliente y el canal vigentes
export const requireReprogramClient = ({
  snapshot
}) => {
  // Detiene clientes ausentes o fusionados
  if (!snapshot.exists || snapshot.data().fusionado === true) {
    fail(
      'failed-precondition',
      'El cliente ya no está disponible'
    );
  }

  // Obtiene los datos canónicos
  const data = snapshot.data();
  const name = typeof data.nombreCompleto === 'string'
    ? data.nombreCompleto.trim()
    : '';
  const phone = typeof data.telefonoNormalizado === 'string'
    ? data.telefonoNormalizado
    : '';
  const email = typeof data.emailNormalizado === 'string'
    ? data.emailNormalizado.trim().toLowerCase()
    : '';

  // Detiene contactos incompatibles
  if (
    name.length < 2
    || name.length > 150
    || !/^[0-9]{10}$/.test(phone)
    || (email && !isValidEmail(email))
  ) {
    fail(
      'failed-precondition',
      'El cliente no tiene datos de contacto válidos'
    );
  }

  // Deriva el canal desde el contacto vigente
  const contactChannel = email ? 'correo' : 'llamada';

  // Devuelve la identidad operativa
  return {
    id: snapshot.id,
    name,
    phone,
    email,
    contactChannel
  };
};

// Verifica el destino de un reintento
export const requireExistingReprogramDestination = ({
  request,
  snapshot,
  source,
  sourceAppointmentId
}) => {
  // Detiene destinos ausentes
  if (!snapshot.exists) {
    fail(
      'failed-precondition',
      'La cita reprogramada ya no existe'
    );
  }

  // Obtiene el destino persistido
  const destination = snapshot.data();
  const storedDestination = source.reprogramacion?.destino;
  const storedCredit = source.reprogramacion
    ?.creditoAplicadoCentavos;
  const storedAdditional = source.reprogramacion
    ?.anticipoAdicionalCentavos;
  const destinationDeposit = (
    destination.creditoReprogramacionCentavos
    + destination.anticipoAdicionalCentavos
  );

  // Compara únicamente el destino autorizado
  if (
    destination.schemaVersion !== 3
    || destination.reprogramacionOrigen !== sourceAppointmentId
    || destination.clienteId !== source.clienteId
    || destination.servicioId !== request.serviceId
    || destination.fecha !== request.dateKey
    || destination.hora !== request.time
    || storedDestination?.citaId !== snapshot.id
    || storedDestination?.servicioId !== request.serviceId
    || storedDestination?.fecha !== request.dateKey
    || storedDestination?.hora !== request.time
    || destination.cupoId !== source.reprogramacion?.cupoId
    || !isPositiveInteger(
      destination.creditoReprogramacionCentavos
    )
    || !Number.isSafeInteger(
      destination.anticipoAdicionalCentavos
    )
    || destination.anticipoAdicionalCentavos < 0
    || !Array.isArray(destination.pagosAnticipoIds)
    || destination.pagosAnticipoIds.length < 1
    || destination.pagosAnticipoIds.length > MAX_DEPOSIT_PAYMENTS
    || destination.pagosAnticipoIds.some(
      (id) => !isDocumentId(id)
    )
    || new Set(destination.pagosAnticipoIds).size
      !== destination.pagosAnticipoIds.length
    || !Number.isSafeInteger(destinationDeposit)
    || destination.anticipoMontoCentavos !== destinationDeposit
    || storedCredit !== destination.creditoReprogramacionCentavos
    || storedAdditional !== destination.anticipoAdicionalCentavos
  ) {
    fail(
      'failed-precondition',
      'El anticipo ya fue usado en otra reprogramación'
    );
  }

  // Devuelve el destino verificado
  return destination;
};
