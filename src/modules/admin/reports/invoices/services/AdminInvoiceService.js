import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../../../config/firebase';

const getInvoicesCallable = httpsCallable(
  functionsInstance,
  'getAdminInvoiceRequests'
);
const manageInvoiceCallable = httpsCallable(
  functionsInstance,
  'manageAdminInvoiceRequest'
);

// Traduce fallos remotos a mensajes comprensibles
const getInvoiceErrorMessage = (error) => {
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no puede administrar facturas';
  }
  if (error?.code === 'functions/unauthenticated') {
    return 'Tu sesión terminó Vuelve a iniciar sesión';
  }
  if (error?.code === 'functions/failed-precondition') {
    return error?.message || 'Actualiza la solicitud antes de continuar';
  }
  if (error?.code === 'functions/invalid-argument') {
    return error?.message || 'Revisa los datos de la factura';
  }
  if (error?.code === 'functions/not-found') {
    return 'La solicitud ya no está disponible';
  }
  return 'No se pudo completar la operación Inténtalo nuevamente';
};

// Convierte la respuesta remota en datos de interfaz
const mapInvoiceRequest = (request) => ({
  ...request,
  requestedAt: request.requestedAt ? new Date(request.requestedAt) : null,
  updatedAt: request.updatedAt ? new Date(request.updatedAt) : null
});

// Consulta las solicitudes privadas de facturación
export const loadAdminInvoiceRequests = async () => {
  try {
    const response = await getInvoicesCallable();
    const requests = Array.isArray(response.data?.requests)
      ? response.data.requests.map(mapInvoiceRequest)
      : [];
    return {
      requests,
      warningCount: Number(response.data?.warningCount) || 0
    };
  } catch (error) {
    throw new Error(getInvoiceErrorMessage(error), { cause: error });
  }
};

// Guarda un cambio de estado validado por el servidor
export const updateAdminInvoiceRequest = async (request) => {
  try {
    const response = await manageInvoiceCallable(request);
    return response.data;
  } catch (error) {
    throw new Error(getInvoiceErrorMessage(error), { cause: error });
  }
};
