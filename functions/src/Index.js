import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { defineJsonSecret } from 'firebase-functions/params';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { onCall } from 'firebase-functions/v2/https';
import { adjustRetailStockHandler } from './AdjustRetailStock.js';
import {
  createReceptionAppointmentHandler
} from './CreateReceptionAppointment.js';
import { sendEmailJsTemplate } from './EmailJsTransport.js';
import { finalizeReceptionSaleHandler } from './FinalizeReceptionSale.js';
import {
  manageReceptionAppointmentHandler
} from './ManageReceptionAppointment.js';
import { manageCabinSupplyHandler } from './ManageCabinSupply.js';
import { manageCashCloseHandler } from './ManageCashClose.js';
import { createClinicalFunctions } from './ClinicalFunctions.js';
import { manageRetailProductHandler } from './ManageRetailProduct.js';
import {
  manageScheduleAvailabilityHandler
} from './ManageScheduleAvailability.js';
import { manageServiceCatalogHandler } from './ManageServiceCatalog.js';
import {
  reprogramReceptionAppointmentHandler
} from './ReprogramReceptionAppointment.js';
import {
  resolveUnconfirmedSaleTicketHandler
} from './ResolveUnconfirmedSaleTicket.js';
import { retrySaleTicketHandler } from './RetrySaleTicket.js';
import { sendSaleTicketHandler } from './SendSaleTicket.js';

initializeApp();

// Declara la configuración protegida de EmailJS
const emailJsConfig = defineJsonSecret('EMAILJS_CONFIG');

// Obtiene la configuración del proceso
const environment = globalThis.process?.env ?? {};

// Detecta la ejecución local de funciones
const isEmulator = environment.FUNCTIONS_EMULATOR === 'true';

// Obtiene la decisión explícita para pruebas
const enforceEmulatorAppCheck = (
  environment.ENFORCE_APP_CHECK_IN_EMULATOR === 'true'
);

// Protege producción y permite pruebas locales controladas
const enforceAppCheck = !isEmulator || enforceEmulatorAppCheck;

// Detecta la autorización explícita para correo local
const enableEmulatorEmail = (
  environment.ENABLE_EMAIL_DELIVERY_IN_EMULATOR === 'true'
);

// Define los recursos limitados de cada función
const runtimeOptions = {
  region: 'us-central1',
  memory: '256MiB',
  timeoutSeconds: 30,
  minInstances: 0,
  maxInstances: 1,
  concurrency: 1
};

// Crea el transporte con el secreto disponible
const createEmailSender = () => {
  // Devuelve el adaptador esperado por el dominio
  return ({ templateParameters }) => {
    // Obtiene el secreto únicamente al enviar
    const config = emailJsConfig.value();

    // Ejecuta el transporte protegido
    return sendEmailJsTemplate({
      config,
      templateParameters
    });
  };
};

// Registra una cita presencial de manera atómica
export const createReceptionAppointment = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => createReceptionAppointmentHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Gestiona el ciclo operativo de una cita
export const manageReceptionAppointment = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageReceptionAppointmentHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Reprograma una cita con su crédito disponible
export const reprogramReceptionAppointment = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => reprogramReceptionAppointmentHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Finaliza una venta presencial de manera atómica
export const finalizeReceptionSale = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => finalizeReceptionSaleHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Administra el catálogo retail de manera atómica
export const manageRetailProduct = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageRetailProductHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore(),
  storage: getStorage()
}));

// Ajusta existencias retail de manera atómica
export const adjustRetailStock = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => adjustRetailStockHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Administra el inventario interno de cabina
export const manageCabinSupply = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageCabinSupplyHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Guarda y corrige cortes de dias terminados
export const manageCashClose = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageCashCloseHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Expone las funciones del flujo clínico
export const {
  manageClinicalConsent,
  manageClinicalRecord,
  manageClinicalSession,
  recordCabinConsumption
} = createClinicalFunctions({ enforceAppCheck, runtimeOptions });

// Administra el catalogo real de servicios
export const manageServiceCatalog = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageServiceCatalogHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Administra los bloqueos reales de la agenda
export const manageScheduleAvailability = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => manageScheduleAvailabilityHandler({
  auth: request.auth,
  data: request.data,
  firestore: getFirestore()
}));

// Envía tickets pendientes con un único trabajador
export const sendSaleTicket = onDocumentWritten({
  ...runtimeOptions,
  document: 'ventas/{saleId}',
  secrets: [emailJsConfig],
  retry: true
}, async (event) => {
  // Obtiene la versión posterior del documento
  const saleSnapshot = event.data?.after;

  // Ignora eliminaciones y estados que no solicitan envío
  if (
    !saleSnapshot?.exists
    || saleSnapshot.data().ticket?.estado !== 'pendiente'
  ) {
    // Devuelve una salida sin trabajo
    return null;
  }

  // Evita conexiones externas durante pruebas locales
  if (isEmulator && !enableEmulatorEmail) {
    // Devuelve una omisión exclusiva del emulador
    return {
      saleId: event.params.saleId,
      ticketStatus: 'pendiente',
      sent: false
    };
  }

  // Ejecuta un único intento automático
  const result = await sendSaleTicketHandler({
    attemptId: event.id,
    firestore: getFirestore(),
    saleId: event.params.saleId,
    sendEmail: createEmailSender()
  });

  // Registra solo información técnica segura
  if (['fallido', 'no_confirmado'].includes(result.ticketStatus)) {
    logger.error('No se pudo enviar el ticket digital', {
      saleId: event.params.saleId,
      errorCode: result.errorCode
    });
  }

  // Devuelve el resultado operativo
  return result;
});

// Reintenta manualmente un ticket fallido
export const retrySaleTicket = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => {
  // Agenda el reintento sin contactar al proveedor
  return retrySaleTicketHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore()
  });
});

// Resuelve manualmente una entrega ambigua
export const resolveUnconfirmedSaleTicket = onCall({
  ...runtimeOptions,
  enforceAppCheck
}, (request) => {
  // Ejecuta la resolución auditada
  return resolveUnconfirmedSaleTicketHandler({
    auth: request.auth,
    data: request.data,
    firestore: getFirestore()
  });
});
