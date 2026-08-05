import { SaleError } from './SaleError.js';
import {
  hasSameDepositPart,
  isValidDepositPart
} from './DepositPolicy.js';

// Define los límites del anticipo consolidado
const MAX_DEPOSIT_DOCUMENTS = 5;
const MAX_DOCUMENT_PARTS = 2;
const MAX_APPOINTMENT_PARTS = 10;

// Lanza un error conocido del dominio
const fail = (code, message) => {
  throw new SaleError(code, message);
};

// Reconoce enteros monetarios positivos
const isPositiveInteger = (value) => Number.isSafeInteger(value) && value > 0;

// Reconoce identificadores documentales seguros
const isSafeDocumentId = (value) => typeof value === 'string'
  && value.length > 0
  && value.length <= 500
  && !value.includes('/');

// Suma partes financieras sin perder precisión
const sumDepositParts = (parts) => parts.reduce((total, part) => {
  // Detiene partes inválidas
  if (!isValidDepositPart(part)) {
    return Number.NaN;
  }
  // Calcula el siguiente acumulado
  const nextTotal = total + part.montoCentavos;
  // Detiene acumulados inseguros
  return Number.isSafeInteger(nextTotal) ? nextTotal : Number.NaN;
}, 0);

// Obtiene el método consolidado de varias partes
const resolveDepositMethod = (parts) => {
  // Reúne los métodos financieros únicos
  const methods = new Set(parts.map(({ metodo }) => metodo));
  // Devuelve el método único o mixto
  return methods.size === 1 ? parts[0].metodo : 'mixto';
};

// Normaliza únicamente correos heredados seguros
const normalizeStoredEmail = (value) => {
  // Limpia el correo persistido
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  // Separa el dominio del correo
  const separatorIndex = normalized.lastIndexOf('@');
  // Omite correos incompletos sin bloquear la venta
  if (
    normalized.length > 254
    || separatorIndex < 1
    || separatorIndex > 64
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    // Devuelve ausencia segura
    return '';
  }

  // Devuelve el correo canónico
  return normalized;
};

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

  // Calcula el anticipo mínimo vigente
  const requiredDepositCents = Math.round(data.precioServicioCentavos * 30 / 100);

  // Reconoce el contrato financiero extendido
  const hasExplicitRequiredDeposit = Object.hasOwn(data, 'anticipoRequeridoCentavos');

  // Obtiene el anticipo requerido persistido
  const storedRequiredDepositCents = hasExplicitRequiredDeposit
    ? data.anticipoRequeridoCentavos
    : requiredDepositCents;

  // Valida los identificadores explícitos cuando existen
  const hasValidPaymentIds = !Object.hasOwn(data, 'pagosAnticipoIds') || (
    Array.isArray(data.pagosAnticipoIds)
    && data.pagosAnticipoIds.length >= 1
    && data.pagosAnticipoIds.length <= MAX_DEPOSIT_DOCUMENTS
    && data.pagosAnticipoIds.every(isSafeDocumentId)
    && new Set(data.pagosAnticipoIds).size === data.pagosAnticipoIds.length
  );

  // Detiene citas con un contrato financiero inválido
  if (
    data.schemaVersion !== 3
    || data.estado !== 'por_cobrar'
    || !isPositiveInteger(data.precioServicioCentavos)
    || data.anticipoPagado !== true
    || data.anticipoPorcentaje !== 30
    || storedRequiredDepositCents !== requiredDepositCents
    || !isPositiveInteger(data.anticipoMontoCentavos)
    || (!hasExplicitRequiredDeposit
      && data.anticipoMontoCentavos !== requiredDepositCents)
    || data.anticipoMontoCentavos < storedRequiredDepositCents
    || data.anticipoMontoCentavos > data.precioServicioCentavos
    || !isSafeDocumentId(data.clienteId)
    || !isSafeDocumentId(data.cupoId)
    || !isSafeDocumentId(data.servicioId)
    || typeof data.servicio !== 'string'
    || !data.servicio.trim()
    || !Array.isArray(data.anticipoPagos)
    || data.anticipoPagos.length < 1
    || data.anticipoPagos.length > MAX_APPOINTMENT_PARTS
    || !hasValidPaymentIds
  ) {
    fail('failed-precondition', 'La cita tiene información de cobro inválida');
  }

  // Suma las partes válidas del anticipo
  const depositTotalCents = sumDepositParts(data.anticipoPagos);

  // Detiene anticipos o métodos que no coinciden
  if (
    depositTotalCents !== data.anticipoMontoCentavos
    || data.anticipoMetodo !== resolveDepositMethod(data.anticipoPagos)
  ) {
    fail('failed-precondition', 'El anticipo de la cita no coincide');
  }

  // Devuelve la cita validada
  return data;
};

// Verifica el horario reservado antes de cobrar
export const requireCheckoutSlot = ({ appointmentId, snapshot }) => {
  // Detiene horarios inexistentes o ajenos a la cita
  if (!snapshot?.exists || snapshot.data().citaId !== appointmentId) {
    fail('failed-precondition', 'El horario reservado de la cita no coincide');
  }
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
    email: normalizeStoredEmail(data.emailNormalizado)
  };
};

// Verifica un movimiento real del anticipo
const requireDepositDocument = ({ appointment, paymentId, snapshot }) => {
  // Detiene anticipos inexistentes o inesperados
  if (
    !snapshot?.exists
    || !isSafeDocumentId(paymentId)
    || (typeof snapshot.id === 'string' && snapshot.id !== paymentId)
  ) {
    fail('failed-precondition', 'El anticipo no está registrado en pagos');
  }

  // Obtiene el movimiento financiero
  const data = snapshot.data();

  // Valida las partes del documento
  const hasValidParts = (
    Array.isArray(data.partes)
    && data.partes.length >= 1
    && data.partes.length <= MAX_DOCUMENT_PARTS
    && sumDepositParts(data.partes) === data.montoCentavos
    && data.metodo === resolveDepositMethod(data.partes)
  );

  // Prioriza la aplicación vigente cuando está persistida
  const hasCurrentLink = Object.hasOwn(data, 'aplicadaACitaId')
    ? data.aplicadaACitaId === appointment.id
    : data.citaId === appointment.id;

  // Detiene movimientos incompatibles con la cita
  if (
    data.schemaVersion !== 1
    || data.tipo !== 'anticipo'
    || data.estado !== 'confirmado'
    || data.ventaId !== null
    || data.clienteId !== appointment.data.clienteId
    || !isSafeDocumentId(data.citaId)
    || !isPositiveInteger(data.montoCentavos)
    || !hasValidParts
    || !hasCurrentLink
    || data.sucursalId !== 'principal'
    || typeof data.fecha?.toMillis !== 'function'
    || typeof data.actorUid !== 'string'
    || !data.actorUid
  ) {
    fail('failed-precondition', 'El registro del anticipo no coincide');
  }

  // Devuelve el movimiento validado
  return data;
};

// Verifica todos los movimientos reales del anticipo
export const requireDepositPayments = ({ appointment, paymentIds, snapshots }) => {
  // Detiene listas incompletas o fuera de límite
  if (
    !Array.isArray(paymentIds)
    || !Array.isArray(snapshots)
    || paymentIds.length < 1
    || paymentIds.length > MAX_DEPOSIT_DOCUMENTS
    || snapshots.length !== paymentIds.length
    || paymentIds.some((id) => !isSafeDocumentId(id))
    || new Set(paymentIds).size !== paymentIds.length
  ) {
    fail('failed-precondition', 'Los pagos del anticipo no son válidos');
  }

  // Valida cada movimiento en el orden persistido
  const payments = snapshots.map((snapshot, index) => (
    requireDepositDocument({
      appointment,
      paymentId: paymentIds[index],
      snapshot
    })
  ));

  // Consolida las partes reales de todos los movimientos
  const actualParts = payments.flatMap(({ partes }) => partes);

  // Suma los importes reales de todos los movimientos
  const totalCents = payments.reduce((total, payment) => {
    // Calcula el siguiente acumulado
    const nextTotal = total + payment.montoCentavos;

    // Detiene acumulados inseguros
    return Number.isSafeInteger(nextTotal) ? nextTotal : Number.NaN;
  }, 0);

  // Comprueba el agregado persistido en la cita
  const hasMatchingParts = (
    actualParts.length === appointment.data.anticipoPagos.length
    && actualParts.every(
      (part, index) => (
        hasSameDepositPart(part, appointment.data.anticipoPagos[index])
      )
    )
  );

  // Detiene anticipos alterados o incompletos
  if (
    totalCents !== appointment.data.anticipoMontoCentavos
    || !hasMatchingParts
  ) {
    fail('failed-precondition', 'El registro del anticipo no coincide');
  }

  // Devuelve la evidencia financiera validada
  return { payments, totalCents };
};

// Conserva compatibilidad con la validación singular
export const requireDepositPayment = ({ appointment, snapshot }) => requireDepositPayments({
  appointment,
  paymentIds: [snapshot?.id ?? `${appointment.id}_anticipo`],
  snapshots: [snapshot]
});
