import { randomUUID } from 'node:crypto';
import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  buildCheckoutPaymentId,
  buildDepositPaymentId,
  buildInventoryMovementId,
  buildSaleIdentifiers
} from '../src/SaleIdentifiers.js';
import { validateSaleRequest } from '../src/SalePolicy.js';

// Define el proyecto aislado del emulador
const PROJECT_ID = 'demo-lumina';

// Construye un escenario único de venta
export const createIntegrationScenario = () => {
  // Construye identificadores únicos
  const suffix = randomUUID().replaceAll('-', '');

  // Identifica al actor autorizado
  const actorUid = `reception_${suffix}`;

  // Identifica al cliente
  const clientId = `client_${suffix}`;

  // Identifica la cita
  const appointmentId = `appointment_${suffix}`;

  // Identifica el horario reservado
  const slotId = `slot_${suffix}`;

  // Identifica el producto
  const productId = `product_${suffix}`;

  // Define la clave estable del intento
  const idempotencyKey = `integration_${suffix}`;

  // Inicializa una aplicación exclusiva
  const app = initializeApp(
    { projectId: PROJECT_ID },
    `sale-integration-${suffix}`
  );

  // Obtiene Firestore enlazado al emulador
  const firestore = getFirestore(app);

  // Define la solicitud repetible
  const requestData = {
    appointmentId,
    idempotencyKey,
    productItems: [{ productId, quantity: 2 }],
    payments: [
      {
        method: 'efectivo',
        amountCents: 30_000,
        cashReceivedCents: 40_000
      },
      {
        method: 'transferencia',
        amountCents: 41_500,
        reference: 'SPEI-INTEGRACION'
      }
    ]
  };

  // Normaliza la solicitud pública
  const request = validateSaleRequest(requestData);

  // Construye la venta determinista
  const { saleId } = buildSaleIdentifiers(request);

  // Identifica el anticipo previo
  const depositPaymentId = buildDepositPaymentId(appointmentId);

  // Identifica la primera liquidación
  const cashPaymentId = buildCheckoutPaymentId(saleId, 0);

  // Identifica la segunda liquidación
  const transferPaymentId = buildCheckoutPaymentId(saleId, 1);

  // Identifica el movimiento de inventario
  const movementId = buildInventoryMovementId(saleId, productId);

  // Reúne las referencias del escenario
  const references = {
    actor: firestore.collection('usuarios').doc(actorUid),
    appointment: firestore.collection('citas').doc(appointmentId),
    client: firestore.collection('clientes').doc(clientId),
    deposit: firestore.collection('pagos').doc(depositPaymentId),
    cashPayment: firestore.collection('pagos').doc(cashPaymentId),
    transferPayment: firestore.collection('pagos').doc(transferPaymentId),
    product: firestore.collection('productos').doc(productId),
    movement: firestore.collection('movimientosInventario').doc(movementId),
    sale: firestore.collection('ventas').doc(saleId),
    slot: firestore.collection('cupos').doc(slotId)
  };

  // Identifica el evento final
  const eventReference = references.appointment
    .collection('eventos')
    .doc('finalizada');

  // Devuelve el escenario completo
  return {
    actorUid,
    app,
    appointmentId,
    clientId,
    eventReference,
    firestore,
    productId,
    references,
    requestData,
    saleId,
    slotId
  };
};

// Prepara los datos requeridos por la transacción
export const seedIntegrationScenario = async (scenario) => {
  // Inicia una escritura agrupada
  const seed = scenario.firestore.batch();

  // Define una fecha real del emulador
  const seedTimestamp = Timestamp.now();

  seed.set(scenario.references.actor, {
    activo: true,
    rol: 'recepcion'
  });
  seed.set(scenario.references.client, {
    nombreCompleto: 'Cliente Integración',
    emailNormalizado: 'cliente.integracion@example.com',
    fusionado: false
  });
  seed.set(scenario.references.product, {
    schemaVersion: 1,
    activo: true,
    nombre: 'Producto Integración',
    categoria: 'Cuidado facial',
    descripcion: 'Producto para prueba integrada',
    imagenUrl: '',
    precioCentavos: 20_000,
    existencias: 30,
    stockMinimo: 5
  });
  seed.set(scenario.references.deposit, {
    schemaVersion: 1,
    tipo: 'anticipo',
    estado: 'confirmado',
    citaId: scenario.appointmentId,
    ventaId: null,
    clienteId: scenario.clientId,
    metodo: 'efectivo',
    montoCentavos: 13_500,
    partes: [{
      metodo: 'efectivo',
      montoCentavos: 13_500,
      efectivoRecibidoCentavos: 13_500,
      cambioCentavos: 0,
      referencia: '',
      ultimosCuatro: ''
    }],
    sucursalId: 'principal',
    fecha: seedTimestamp,
    actorUid: scenario.actorUid
  });
  seed.set(scenario.references.appointment, {
    schemaVersion: 3,
    estado: 'por_cobrar',
    clienteId: scenario.clientId,
    cupoId: scenario.slotId,
    servicioId: 'limpieza-facial-profunda',
    servicio: 'Limpieza facial profunda',
    precioServicioCentavos: 45_000,
    anticipoPagado: true,
    anticipoPorcentaje: 30,
    anticipoMontoCentavos: 13_500,
    anticipoMetodo: 'efectivo',
    anticipoPagos: [{
      metodo: 'efectivo',
      montoCentavos: 13_500,
      efectivoRecibidoCentavos: 13_500,
      cambioCentavos: 0,
      referencia: '',
      ultimosCuatro: ''
    }],
    creadaEn: seedTimestamp,
    creadaPor: scenario.actorUid
  });
  seed.set(scenario.references.slot, {
    citaId: scenario.appointmentId
  });

  // Persiste el escenario en el emulador
  await seed.commit();
};

// Elimina exclusivamente los datos de prueba
export const cleanupIntegrationScenario = async (scenario) => {
  // Inicia una limpieza agrupada
  const cleanup = scenario.firestore.batch();

  // Elimina cada documento creado
  Object.values(scenario.references).forEach(
    (reference) => cleanup.delete(reference)
  );

  // Elimina el evento anidado
  cleanup.delete(scenario.eventReference);

  // Ejecuta la limpieza local
  await cleanup.commit();

  // Cierra la aplicación de prueba
  await deleteApp(scenario.app);
};
