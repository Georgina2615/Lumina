import { collection, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../../config/firebase';

const manageCatalogCallable = httpsCallable(
  functionsInstance,
  'manageServiceCatalog'
);

// Representa un fallo seguro para la interfaz
export class ServiceCatalogCommandError extends Error {
  // Conserva el codigo remoto sin mostrar detalles tecnicos
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = 'ServiceCatalogCommandError';
    this.code = code;
  }
}

// Traduce fallos remotos a mensajes claros
const getCatalogErrorMessage = (error) => {
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permisos para administrar servicios';
  }

  if (error?.code === 'functions/already-exists') {
    return 'Ya existe un servicio con ese nombre';
  }

  if (
    error?.code === 'functions/aborted'
    || error?.code === 'functions/failed-precondition'
  ) {
    return error?.code === 'functions/aborted'
      ? 'El servicio cambió en otra ventana. Ciérralo y vuelve a abrirlo.'
      : 'Guarda el servicio antes de mostrarlo en la agenda.';
  }

  if (error?.code === 'functions/unauthenticated') {
    return 'Tu sesión terminó. Vuelve a iniciar sesión.';
  }

  if (error?.code === 'functions/not-found') {
    return 'No se encontró la información necesaria. Actualiza la lista e inténtalo nuevamente.';
  }

  if (error?.code === 'functions/invalid-argument') {
    return 'Revisa los datos del servicio e inténtalo nuevamente.';
  }

  if (error?.code === 'functions/resource-exhausted') {
    return 'No se puede agregar otro servicio por el momento.';
  }

  if ([
    'functions/deadline-exceeded',
    'functions/internal',
    'functions/unknown',
    'functions/unavailable'
  ].includes(error?.code)) {
    return 'No se pudo conectar con los servicios. Inténtalo nuevamente.';
  }

  return 'No se pudo guardar el servicio. Inténtalo nuevamente.';
};

// Ejecuta una orden y devuelve su respuesta
const runCatalogCommand = async (payload) => {
  try {
    const response = await manageCatalogCallable(payload);
    return response.data;
  } catch (error) {
    throw new ServiceCatalogCommandError(
      error?.code ?? 'functions/unknown',
      getCatalogErrorMessage(error),
      error
    );
  }
};

// Reserva un identificador sin escribir datos
export const createServiceId = () => (
  doc(collection(db, 'servicios')).id
);

// Crea un servicio real
export const createAdminService = (payload) => runCatalogCommand({
  ...payload,
  action: 'create'
});

// Actualiza datos visibles del servicio
export const updateAdminService = (payload) => runCatalogCommand({
  ...payload,
  action: 'update'
});

// Cambia la disponibilidad sin borrar historial
export const setAdminServiceActive = (payload) => runCatalogCommand({
  ...payload,
  action: 'set_active'
});
