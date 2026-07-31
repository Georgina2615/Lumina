import {
  collection,
  doc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

// Valida textos obligatorios del catálogo
const requireText = (value, label) => {
  // Normaliza el texto persistido
  const normalizedValue = String(value ?? '').trim();
  // Rechaza texto ausente
  if (!normalizedValue) {
    throw new Error(`${label} no está configurado`);
  }
  // Devuelve texto verificado
  return normalizedValue;
};

// Valida enteros del catálogo
const requireInteger = (value, label, minimum = 0) => {
  // Rechaza enteros fuera de rango
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${label} no es válido`);
  }
  // Devuelve el entero verificado
  return value;
};

// Convierte productos persistidos al contrato visual
const mapRetailProduct = (snapshot) => {
  // Lee el producto persistido
  const data = snapshot.data();
  // Exige el esquema vigente
  if (data.schemaVersion !== 1) {
    throw new Error('Un producto no tiene el formato vigente');
  }
  // Devuelve el contrato visual
  return {
    id: snapshot.id,
    name: requireText(data.nombre, 'El nombre del producto'),
    category: requireText(data.categoria, 'La categoría del producto'),
    description: String(data.descripcion ?? '').trim(),
    imageUrl: String(data.imagenUrl ?? '').trim(),
    priceCents: requireInteger(data.precioCentavos, 'El precio', 1),
    stock: requireInteger(data.existencias, 'La existencia'),
    lowStockThreshold: requireInteger(data.stockMinimo, 'El stock mínimo'),
    schemaVersion: data.schemaVersion
  };
};

// Verifica que el método represente las partes guardadas
const hasMatchingDepositMethod = (data) => {
  // Reúne los métodos reales sin repetirlos
  const methods = [...new Set(
    data.anticipoPagos.map((payment) => payment?.metodo)
  )];

  // Compara el método individual o combinado
  return methods.length === 1
    ? data.anticipoMetodo === methods[0]
    : methods.length >= 2 && data.anticipoMetodo === 'mixto';
};

// Verifica las identidades de pagos acumulados
const hasValidDepositPaymentIds = (data) => {
  // Las citas normales conservan su contrato anterior
  if (!data.reprogramacionOrigen) {
    return true;
  }

  // Exige entre uno y cinco pagos reales
  if (
    typeof data.reprogramacionOrigen !== 'string'
    || !data.reprogramacionOrigen
    || data.reprogramacionOrigen.includes('/')
    || !Array.isArray(data.pagosAnticipoIds)
    || data.pagosAnticipoIds.length < 1
    || data.pagosAnticipoIds.length > 5
    || data.anticipoPagos.length > data.pagosAnticipoIds.length * 2
  ) {
    return false;
  }

  // Exige identidades únicas y seguras
  const uniqueIds = new Set(data.pagosAnticipoIds);
  return uniqueIds.size === data.pagosAnticipoIds.length
    && data.pagosAnticipoIds.every((paymentId) => (
      typeof paymentId === 'string'
      && paymentId.length >= 1
      && paymentId.length <= 500
      && !paymentId.includes('/')
    ));
};

// Verifica el total requerido según el origen de la cita
const hasValidDepositAmount = (data, expectedDepositCents) => {
  // Conserva la igualdad exacta para citas normales
  if (!data.reprogramacionOrigen) {
    return data.anticipoMontoCentavos === expectedDepositCents;
  }

  // Obtiene el mínimo canónico persistido
  const requiredDepositCents = Number.isSafeInteger(
    data.anticipoRequeridoCentavos
  )
    ? data.anticipoRequeridoCentavos
    : expectedDepositCents;

  // Acepta crédito acumulado sin superar el servicio
  return requiredDepositCents === expectedDepositCents
    && data.anticipoMontoCentavos >= requiredDepositCents
    && data.anticipoMontoCentavos <= data.precioServicioCentavos;
};

// Identifica si una cita pertenece al flujo vigente
const getAppointmentChargeIssue = (data) => {
  // Descarta citas heredadas
  if (data.schemaVersion !== 3) {
    // Devuelve el motivo operativo
    return 'Esta cita de prueba no pertenece al flujo de cobro vigente';
  }
  // Verifica datos financieros
  if (
    !Number.isSafeInteger(data.precioServicioCentavos)
    || data.precioServicioCentavos <= 0
    || !Number.isSafeInteger(data.anticipoMontoCentavos)
    || data.anticipoMontoCentavos < 0
    || data.anticipoMontoCentavos > data.precioServicioCentavos
    || data.anticipoPagado !== true
    || data.anticipoPorcentaje !== 30
    || typeof data.clienteId !== 'string'
    || !data.clienteId
    || typeof data.servicioId !== 'string'
    || !data.servicioId
    || typeof data.servicio !== 'string'
    || !data.servicio.trim()
    || !Array.isArray(data.anticipoPagos)
    || data.anticipoPagos.length < 1
    || data.anticipoPagos.length > (
      data.reprogramacionOrigen ? 10 : 2
    )
    || !hasValidDepositPaymentIds(data)
  ) {
    // Devuelve el motivo financiero
    return 'La cita no tiene importes válidos para cobrar';
  }
  // Calcula el anticipo obligatorio
  const expectedDepositCents = Math.round(
    data.precioServicioCentavos * 30 / 100
  );
  // Verifica el porcentaje monetario exacto
  if (!hasValidDepositAmount(data, expectedDepositCents)) {
    // Devuelve el motivo del porcentaje
    return 'El anticipo no corresponde al treinta por ciento del servicio';
  }
  // Verifica el método resumido
  if (!hasMatchingDepositMethod(data)) {
    // Devuelve el motivo del método
    return 'El método del anticipo no coincide con sus pagos';
  }
  // Suma pagos del anticipo
  const depositPaymentsCents = data.anticipoPagos.reduce(
    (totalCents, payment) => (
      ['efectivo', 'tarjeta', 'transferencia'].includes(payment?.metodo)
      && Number.isSafeInteger(payment?.montoCentavos)
      && payment.montoCentavos > 0
        ? totalCents + payment.montoCentavos
        : Number.NaN
    ),
    0
  );
  // Compara el anticipo persistido
  if (depositPaymentsCents !== data.anticipoMontoCentavos) {
    // Devuelve el motivo contable
    return 'Los pagos del anticipo no coinciden con la cita';
  }
  // Verifica el estado de cobro
  if (data.estado !== 'por_cobrar') {
    // Devuelve el estado comprensible
    return data.estado === 'finalizada'
      ? 'Esta cita ya fue cobrada'
      : 'La cita todavía no está lista para cobrar';
  }
  // Confirma que puede cobrarse
  return null;
};

// Convierte la cita persistida al contrato visual
const mapAppointment = (snapshot) => {
  // Detecta una cita inexistente
  if (!snapshot.exists()) {
    // Devuelve ausencia real
    return null;
  }
  // Lee la cita persistida
  const data = snapshot.data();
  // Devuelve el contrato visual
  return {
    id: snapshot.id,
    clientId: data.clienteId ?? null,
    clientName: String(data.nombreCompleto ?? '').trim(),
    serviceId: data.servicioId ?? null,
    serviceName: String(data.servicio ?? '').trim(),
    servicePriceCents: data.precioServicioCentavos,
    depositAmountCents: data.anticipoMontoCentavos,
    dateKey: data.fecha,
    time: data.hora,
    state: data.estado,
    schemaVersion: data.schemaVersion,
    chargeIssue: getAppointmentChargeIssue(data)
  };
};

// Escucha el catálogo comercial activo
export const subscribeRetailProducts = ({ onData, onError }) => (
  onSnapshot(
    query(collection(db, 'productos'), where('activo', '==', true)),
    (snapshot) => {
      try {
        // Convierte y ordena productos
        const products = snapshot.docs
          .map(mapRetailProduct)
          .sort((first, second) => (
            first.category.localeCompare(second.category, 'es')
            || first.name.localeCompare(second.name, 'es')
          ));
        onData(products);
      } catch (error) {
        onError(error);
      }
    },
    onError
  )
);

// Escucha siempre la versión vigente de la cita
export const subscribePOSAppointment = ({
  appointmentId,
  onData,
  onError
}) => {
  // Rechaza rutas manipuladas
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(String(appointmentId ?? ''))) {
    throw new Error('El identificador de la cita no es válido');
  }
  // Devuelve la suscripción vigente
  return onSnapshot(
    doc(db, 'citas', appointmentId),
    (snapshot) => onData(mapAppointment(snapshot)),
    onError
  );
};
