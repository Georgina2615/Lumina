import { httpsCallable } from 'firebase/functions';
import { collection, doc } from 'firebase/firestore';
import { db, functionsInstance } from '../../../../config/firebase';

const manageProductCallable = httpsCallable(
  functionsInstance,
  'manageRetailProduct'
);
const adjustStockCallable = httpsCallable(
  functionsInstance,
  'adjustRetailStock'
);

// Traduce fallos callable a mensajes operativos
const getInventoryErrorMessage = (error) => {
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permisos para administrar inventario';
  }

  if (error?.code === 'functions/failed-precondition') {
    return error.message || 'El producto cambió y necesita actualizarse';
  }

  if (error?.code === 'functions/unavailable') {
    return 'No hay conexión con la administración de inventario';
  }

  return error?.message || 'No se pudo completar la operación de inventario';
};

// Ejecuta una orden y conserva únicamente su respuesta
const runInventoryCommand = async (callable, payload) => {
  try {
    const response = await callable(payload);
    return response.data;
  } catch (error) {
    throw new Error(getInventoryErrorMessage(error), { cause: error });
  }
};

// Reserva un identificador compatible sin escribir datos
export const createRetailProductId = () => (
  doc(collection(db, 'productos')).id
);

// Crea un producto real con inventario inicial
export const createRetailProduct = (payload) => runInventoryCommand(
  manageProductCallable,
  { ...payload, action: 'create' }
);

// Actualiza únicamente datos comerciales
export const updateRetailProduct = (payload) => runInventoryCommand(
  manageProductCallable,
  { ...payload, action: 'update' }
);

// Cambia la disponibilidad comercial sin eliminar historial
export const setRetailProductActive = (payload) => runInventoryCommand(
  manageProductCallable,
  { ...payload, action: 'set_active' }
);

// Vincula una imagen ya almacenada con el producto
export const attachRetailProductImage = (payload) => runInventoryCommand(
  manageProductCallable,
  { ...payload, action: 'attach_image' }
);

// Registra un movimiento transaccional de existencias
export const adjustRetailProductStock = (payload) => runInventoryCommand(
  adjustStockCallable,
  payload
);
