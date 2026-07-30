import { SaleError } from './SaleError.js';
import {
  hasSameDepositPart,
  hasSameTimestamp,
  isValidDepositPart
} from './DepositPolicy.js';

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new SaleError(code, message);
};

// Reconoce enteros monetarios positivos
const isPositiveInteger = (value) => (
  Number.isSafeInteger(value) && value > 0
);

// Verifica que el actor conserve permisos operativos
export const requireAuthorizedActor = (snapshot) => {
  // Detiene usuarios sin documento operativo
  if (!snapshot.exists) {
    fail('permission-denied', 'No tienes permisos para registrar ventas');
  }

  // Obtiene los permisos vigentes
  const data = snapshot.data();

  // Detiene usuarios inactivos o ajenos al cobro
  if (
    data.activo !== true
    || !['recepcion', 'admin'].includes(data.rol)
  ) {
    fail('permission-denied', 'No tienes permisos para registrar ventas');
  }
};

// Verifica una cita lista para liquidación
export const requireCheckoutAppointment = (snapshot) => {
  // Detiene citas inexistentes
  if (!snapshot?.exists) {
    fail('not-found', 'La cita ya no existe');
  }

  // Obtiene la cita vigente
  const data = snapshot.data();

  // Detiene citas heredadas
  if (data.schemaVersion !== 3) {
    fail('failed-precondition', 'La cita no tiene el formato de cobro actual');
  }

  // Detiene citas fuera de la columna de cobro
  if (data.estado !== 'por_cobrar') {
    fail('failed-precondition', 'La cita no está lista para cobrar');
  }

  // Valida servicio cliente y anticipo
  if (
    !isPositiveInteger(data.precioServicioCentavos)
    || data.anticipoPagado !== true
    || data.anticipoPorcentaje !== 30
    || !isPositiveInteger(data.anticipoMontoCentavos)
    || data.anticipoMontoCentavos > data.precioServicioCentavos
    || data.anticipoMontoCentavos
      !== Math.round(data.precioServicioCentavos * 30 / 100)
    || typeof data.clienteId !== 'string'
    || !data.clienteId
    || typeof data.servicioId !== 'string'
    || !data.servicioId
    || typeof data.servicio !== 'string'
    || !data.servicio.trim()
    || !Array.isArray(data.anticipoPagos)
    || ![1, 2].includes(data.anticipoPagos.length)
  ) {
    fail('failed-precondition', 'La cita tiene información de cobro inválida');
  }

  // Suma las partes válidas del anticipo
  const depositTotalCents = data.anticipoPagos.reduce(
    (sum, payment) => (
      isValidDepositPart(payment)
        ? sum + payment.montoCentavos
        : Number.NaN
    ),
    0
  );

  // Detiene anticipos que no coinciden
  if (
    !Number.isSafeInteger(depositTotalCents)
    || depositTotalCents !== data.anticipoMontoCentavos
  ) {
    fail('failed-precondition', 'El anticipo de la cita no coincide');
  }

  // Verifica el método total del anticipo
  const hasValidDepositMethod = data.anticipoPagos.length === 1
    ? data.anticipoMetodo === data.anticipoPagos[0].metodo
    : data.anticipoMetodo === 'mixto'
      && data.anticipoPagos[0].metodo !== data.anticipoPagos[1].metodo;

  // Detiene métodos totales incoherentes
  if (!hasValidDepositMethod) {
    fail('failed-precondition', 'El método del anticipo no coincide');
  }

  // Devuelve la cita validada
  return data;
};

// Verifica un cliente vigente
export const requireClient = (snapshot) => {
  // Detiene clientes inexistentes o fusionados
  if (!snapshot?.exists || snapshot.data().fusionado === true) {
    fail('failed-precondition', 'El cliente ya no está disponible');
  }

  // Obtiene los datos del cliente
  const data = snapshot.data();

  // Detiene clientes sin nombre válido
  if (typeof data.nombreCompleto !== 'string' || !data.nombreCompleto.trim()) {
    fail('failed-precondition', 'El cliente no tiene un nombre válido');
  }

  // Devuelve la identidad necesaria para la venta
  return {
    id: snapshot.id,
    name: data.nombreCompleto.trim(),
    email: typeof data.emailNormalizado === 'string'
      ? data.emailNormalizado
      : ''
  };
};

// Verifica el registro previo de cada anticipo
export const requireDepositPayment = ({
  snapshot,
  appointment
}) => {
  // Detiene anticipos inexistentes
  if (!snapshot.exists) {
    fail('failed-precondition', 'El anticipo no está registrado en pagos');
  }

  // Obtiene el movimiento financiero
  const data = snapshot.data();

  // Obtiene las partes originales de la cita
  const appointmentParts = appointment.data.anticipoPagos;

  // Comprueba todas las partes consolidadas
  const hasMatchingParts = (
    Array.isArray(data.partes)
    && data.partes.length === appointmentParts.length
    && data.partes.every(
      (part, index) => (
        isValidDepositPart(part)
        && hasSameDepositPart(part, appointmentParts[index])
      )
    )
  );

  // Comprueba la fecha original cuando existe
  const hasMatchingDate = !Object.hasOwn(appointment.data, 'creadaEn')
    || hasSameTimestamp(data.fecha, appointment.data.creadaEn);

  // Comprueba el actor original cuando existe
  const hasMatchingActor = !Object.hasOwn(appointment.data, 'creadaPor')
    || data.actorUid === appointment.data.creadaPor;

  // Comprueba el vínculo con la cita
  if (
    data.schemaVersion !== 1
    || data.tipo !== 'anticipo'
    || data.estado !== 'confirmado'
    || data.citaId !== appointment.id
    || data.ventaId !== null
    || data.clienteId !== appointment.data.clienteId
    || data.metodo !== appointment.data.anticipoMetodo
    || data.montoCentavos !== appointment.data.anticipoMontoCentavos
    || !hasMatchingParts
    || data.sucursalId !== 'principal'
    || typeof data.fecha?.toMillis !== 'function'
    || typeof data.actorUid !== 'string'
    || !data.actorUid
    || !hasMatchingDate
    || !hasMatchingActor
  ) {
    fail('failed-precondition', 'El registro del anticipo no coincide');
  }
};
