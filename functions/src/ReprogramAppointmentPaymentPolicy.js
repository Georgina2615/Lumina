import {
  buildStoredDepositPart
} from './AppointmentDepositPolicy.js';
import { AppointmentError } from './AppointmentError.js';
import {
  hasSameDepositPart,
  isValidDepositPart
} from './DepositPolicy.js';

// Define el máximo de pagos aplicables
const MAX_DEPOSIT_PAYMENTS = 5;

// Lanza un error conocido
const fail = (code, message) => {
  throw new AppointmentError(code, message);
};

// Suma importes de forma segura
const sumAmounts = (values) => {
  // Suma cada importe recibido
  const total = values.reduce(
    (sum, value) => sum + value,
    0
  );

  // Detiene desbordamientos monetarios
  if (!Number.isSafeInteger(total)) {
    fail(
      'failed-precondition',
      'Los pagos del anticipo no tienen importes válidos'
    );
  }

  // Devuelve el total verificado
  return total;
};

// Verifica el método consolidado
const hasValidMethod = (payment) => (
  Array.isArray(payment.partes)
  && payment.partes.length >= 1
  && payment.partes.length <= 2
  && (
    (payment.partes.length === 1
      && payment.metodo === payment.partes[0].metodo)
    || (payment.partes.length === 2
      && payment.metodo === 'mixto'
      && payment.partes[0].metodo !== payment.partes[1].metodo)
  )
);

// Verifica un pago real del anticipo
const requireSourcePayment = ({
  paymentId,
  snapshot,
  source,
  sourceAppointmentId
}) => {
  // Detiene pagos ausentes
  if (!snapshot.exists || snapshot.id !== paymentId) {
    fail(
      'failed-precondition',
      'No se encontró un pago del anticipo'
    );
  }

  // Obtiene el movimiento persistido
  const payment = snapshot.data();

  // Valida cada parte financiera
  const hasValidParts = (
    Array.isArray(payment.partes)
    && payment.partes.every(isValidDepositPart)
  );
  const partsTotal = hasValidParts
    ? sumAmounts(payment.partes.map(({ montoCentavos }) => montoCentavos))
    : 0;

  // Verifica la propiedad vigente del pago
  const belongsToSource = Object.hasOwn(
    payment,
    'aplicadaACitaId'
  )
    ? payment.aplicadaACitaId === sourceAppointmentId
    : payment.citaId === sourceAppointmentId;

  // Detiene pagos vendidos alterados o ajenos
  if (
    payment.schemaVersion !== 1
    || payment.tipo !== 'anticipo'
    || payment.estado !== 'confirmado'
    || payment.ventaId !== null
    || payment.clienteId !== source.clienteId
    || !belongsToSource
    || !hasValidParts
    || !hasValidMethod(payment)
    || !Number.isSafeInteger(payment.montoCentavos)
    || payment.montoCentavos <= 0
    || payment.montoCentavos !== partsTotal
    || payment.sucursalId !== 'principal'
  ) {
    fail(
      'failed-precondition',
      'Un pago del anticipo no coincide con la cita'
    );
  }

  // Devuelve el pago verificado
  return {
    id: paymentId,
    data: payment
  };
};

// Verifica todos los pagos de la fuente
export const requireSourcePayments = ({
  paymentIds,
  snapshots,
  source,
  sourceAppointmentId
}) => {
  // Detiene lecturas incompletas
  if (snapshots.length !== paymentIds.length) {
    fail(
      'failed-precondition',
      'No se pudieron verificar los pagos del anticipo'
    );
  }

  // Valida cada movimiento real
  const payments = snapshots.map((snapshot, index) => (
    requireSourcePayment({
      paymentId: paymentIds[index],
      snapshot,
      source,
      sourceAppointmentId
    })
  ));

  // Reúne todas las partes en el orden persistido
  const parts = payments.flatMap(({ data }) => data.partes);
  const creditCents = sumAmounts(
    payments.map(({ data }) => data.montoCentavos)
  );

  // Compara el agregado incrustado de la cita
  const hasMatchingEmbeddedParts = (
    Array.isArray(source.anticipoPagos)
    && source.anticipoPagos.length === parts.length
    && source.anticipoPagos.every(
      (part, index) => (
        isValidDepositPart(part)
        && hasSameDepositPart(part, parts[index])
      )
    )
  );

  // Detiene créditos alterados
  if (
    creditCents !== source.anticipoMontoCentavos
    || !hasMatchingEmbeddedParts
  ) {
    fail(
      'failed-precondition',
      'El crédito del anticipo no coincide con sus pagos'
    );
  }

  // Devuelve el crédito comprobado
  return {
    creditCents,
    parts,
    payments
  };
};

// Resuelve el posible pago adicional
export const requireAdditionalDeposit = ({
  additionalDeposit,
  creditCents,
  paymentCount,
  service
}) => {
  // Calcula el anticipo requerido
  const requiredCents = Math.round(
    service.priceCents * service.depositPercentage / 100
  );

  // Impide convertir crédito en saldo a favor
  if (creditCents > service.priceCents) {
    fail(
      'failed-precondition',
      'El crédito supera el precio total del servicio'
    );
  }

  // Calcula únicamente la diferencia necesaria
  const additionalCents = Math.max(
    requiredCents - creditCents,
    0
  );

  // Exige el pago cuando falta anticipo
  if (additionalCents > 0 && !additionalDeposit) {
    fail(
      'invalid-argument',
      'Registra la diferencia del anticipo'
    );
  }

  // Evita cobrar una diferencia inexistente
  if (additionalCents === 0 && additionalDeposit) {
    fail(
      'invalid-argument',
      'La reprogramación no requiere otro anticipo'
    );
  }

  // Construye las partes persistentes
  const additionalParts = additionalDeposit
    ? additionalDeposit.payments.map(buildStoredDepositPart)
    : [];
  const receivedCents = sumAmounts(
    additionalParts.map(({ montoCentavos }) => montoCentavos)
  );

  // Exige el importe exacto de la diferencia
  if (receivedCents !== additionalCents) {
    fail(
      'invalid-argument',
      'El pago adicional no coincide con la diferencia'
    );
  }

  // Protege el máximo de movimientos reales
  if (
    paymentCount + (additionalDeposit ? 1 : 0)
      > MAX_DEPOSIT_PAYMENTS
  ) {
    fail(
      'failed-precondition',
      'La cita alcanzó el máximo de pagos de anticipo'
    );
  }

  // Devuelve el cálculo canónico
  return {
    additionalCents,
    additionalParts,
    requiredCents,
    totalDepositCents: creditCents + additionalCents
  };
};
