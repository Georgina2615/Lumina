import assert from 'node:assert/strict';
import test from 'node:test';
import { Timestamp } from 'firebase-admin/firestore';
import { SaleError } from '../src/SaleError.js';
import {
  requireAuthorizedActor,
  requireCheckoutAppointment,
  requireDepositPayment,
  requireDepositPayments
} from '../src/StoredAppointmentPolicy.js';
import {
  mapExistingSaleResponse,
  requireRetailProduct
} from '../src/StoredProductPolicy.js';

// Define una parte de anticipo válida
const depositPart = {
  metodo: 'efectivo',
  montoCentavos: 13_500,
  efectivoRecibidoCentavos: 14_000,
  cambioCentavos: 500,
  referencia: '',
  ultimosCuatro: ''
};

// Define una parte de transferencia válida
const transferPart = {
  metodo: 'transferencia',
  montoCentavos: 4_500,
  efectivoRecibidoCentavos: 0,
  cambioCentavos: 0,
  referencia: 'SPEI-4500',
  ultimosCuatro: ''
};

// Define la fecha original del anticipo
const originalDate = Timestamp.fromMillis(1_000);

// Construye el contexto original de la cita
const buildAppointment = () => ({
  id: 'appointment_1',
  data: {
    clienteId: 'client_1',
    anticipoMetodo: 'efectivo',
    anticipoMontoCentavos: 13_500,
    anticipoPagos: [depositPart],
    creadaEn: originalDate,
    creadaPor: 'actor_1'
  }
});

// Construye el pago consolidado
const buildDeposit = (overrides = {}) => ({
  citaId: 'appointment_1',
  ventaId: null,
  clienteId: 'client_1',
  tipo: 'anticipo',
  metodo: 'efectivo',
  montoCentavos: 13_500,
  partes: [depositPart],
  estado: 'confirmado',
  fecha: originalDate,
  actorUid: 'actor_1',
  sucursalId: 'principal',
  schemaVersion: 1,
  ...overrides
});

// Construye una cita lista para cobrar
const buildCheckoutAppointmentData = (overrides = {}) => ({
  schemaVersion: 3,
  estado: 'por_cobrar',
  precioServicioCentavos: 45_000,
  anticipoPagado: true,
  anticipoPorcentaje: 30,
  anticipoMontoCentavos: 13_500,
  clienteId: 'client_1',
  cupoId: 'slot_1',
  servicioId: 'service_1',
  servicio: 'Limpieza facial profunda',
  anticipoMetodo: 'efectivo',
  anticipoPagos: [depositPart],
  ...overrides
});

test('verifica el anticipo consolidado antes del cierre', () => {
  assert.doesNotThrow(() => requireDepositPayment({
    snapshot: {
      exists: true,
      data: () => buildDeposit()
    },
    appointment: buildAppointment()
  }));
});

test('rechaza una parte consolidada alterada', () => {
  // Cambia únicamente el monto de la parte
  const alteredPart = {
    ...depositPart,
    montoCentavos: 13_499
  };

  assert.throws(
    () => requireDepositPayment({
      snapshot: {
        exists: true,
        data: () => buildDeposit({ partes: [alteredPart] })
      },
      appointment: buildAppointment()
    }),
    (error) => error instanceof SaleError
  );
});

test('valida varios pagos reales aplicados a la cita actual', () => {
  // Construye el anticipo agregado de una reprogramación
  const appointment = {
    id: 'appointment_2',
    data: {
      clienteId: 'client_1',
      anticipoMetodo: 'mixto',
      anticipoMontoCentavos: 18_000,
      anticipoPagos: [depositPart, transferPart]
    }
  };

  // Conserva un pago de la cita original
  const originalPayment = {
    ...buildDeposit(),
    aplicadaACitaId: 'appointment_2'
  };

  // Registra únicamente la diferencia real
  const additionalPayment = buildDeposit({
    citaId: 'appointment_2',
    metodo: 'transferencia',
    montoCentavos: 4_500,
    partes: [transferPart],
    fecha: Timestamp.fromMillis(2_000),
    actorUid: 'actor_2'
  });

  const result = requireDepositPayments({
    appointment,
    paymentIds: ['appointment_1_anticipo', 'appointment_2_adicional'],
    snapshots: [
      {
        id: 'appointment_1_anticipo',
        exists: true,
        data: () => originalPayment
      },
      {
        id: 'appointment_2_adicional',
        exists: true,
        data: () => additionalPayment
      }
    ]
  });

  assert.equal(result.totalCents, 18_000);
  assert.equal(result.payments.length, 2);
});

test('rechaza un pago aplicado a una cita diferente', () => {
  // Conserva un vínculo vigente ajeno a la cita
  const alteredPayment = buildDeposit({
    aplicadaACitaId: 'appointment_other'
  });

  assert.throws(
    () => requireDepositPayments({
      appointment: buildAppointment(),
      paymentIds: ['appointment_1_anticipo'],
      snapshots: [{
        id: 'appointment_1_anticipo',
        exists: true,
        data: () => alteredPayment
      }]
    }),
    (error) => error instanceof SaleError
  );
});

test('rechaza un reintento con contenido diferente', () => {
  // Simula una venta persistida
  const snapshot = {
    id: 'cita_appointment_1',
    data: () => ({
      schemaVersion: 1,
      estado: 'pagada',
      cobradaPor: 'actor_1',
      citaId: 'appointment_1',
      idempotencia: { hashSolicitud: 'hash_original' },
      desglose: {
        subtotalCentavos: 38_793,
        ivaIncluidoCentavos: 6_207,
        totalCentavos: 45_000,
        anticipoAplicadoCentavos: 13_500,
        saldoCobradoCentavos: 31_500,
        totalPagadoCentavos: 45_000
      }
    })
  };

  assert.throws(
    () => mapExistingSaleResponse(snapshot, {
      actorUid: 'actor_1',
      appointmentId: 'appointment_1',
      requestHash: 'hash_diferente'
    }),
    (error) => error instanceof SaleError
  );
});

test('rechaza operadores inactivos o sin rol de cobro', () => {
  // Construye una identidad inactiva
  const inactiveActor = {
    exists: true,
    data: () => ({ activo: false, rol: 'recepcion' })
  };
  // Construye una identidad clínica sin permiso de venta
  const clinicalActor = {
    exists: true,
    data: () => ({ activo: true, rol: 'cosmetologa' })
  };

  assert.throws(
    () => requireAuthorizedActor(inactiveActor),
    (error) => error instanceof SaleError
  );
  assert.throws(
    () => requireAuthorizedActor(clinicalActor),
    (error) => error instanceof SaleError
  );
});

test('rechaza citas que todavía no están por cobrar', () => {
  // Construye una cita aún dentro de cabina
  const appointmentSnapshot = {
    exists: true,
    data: () => buildCheckoutAppointmentData({ estado: 'en_cabina' })
  };

  assert.throws(
    () => requireCheckoutAppointment(appointmentSnapshot),
    (error) => error instanceof SaleError
  );
});

test('acepta crédito mayor al mínimo y varios identificadores', () => {
  // Construye partes que superan el mínimo vigente
  const extraCreditPart = {
    ...transferPart,
    montoCentavos: 6_500,
    referencia: 'SPEI-6500'
  };

  // Construye una cita reprogramada lista para cobrar
  const appointmentSnapshot = {
    exists: true,
    data: () => buildCheckoutAppointmentData({
      anticipoRequeridoCentavos: 13_500,
      anticipoMontoCentavos: 20_000,
      anticipoMetodo: 'mixto',
      anticipoPagos: [depositPart, extraCreditPart],
      pagosAnticipoIds: ['payment_original', 'payment_additional']
    })
  };

  assert.doesNotThrow(
    () => requireCheckoutAppointment(appointmentSnapshot)
  );
});

test('rechaza productos con inventario insuficiente', () => {
  // Construye un producto con una sola unidad
  const productSnapshot = {
    id: 'product_1',
    exists: true,
    data: () => ({
      schemaVersion: 1,
      activo: true,
      nombre: 'Producto real',
      categoria: 'Cuidado facial',
      precioCentavos: 20_000,
      existencias: 1,
      stockMinimo: 5
    })
  };

  assert.throws(
    () => requireRetailProduct(productSnapshot, {
      productId: 'product_1',
      quantity: 2
    }),
    (error) => error instanceof SaleError
  );
});
