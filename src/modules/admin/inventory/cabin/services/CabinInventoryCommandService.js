import { collection, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsInstance } from '../../../../../config/firebase';

const manageCabinSupplyCallable = httpsCallable(
  functionsInstance,
  'manageCabinSupply'
);

// Traduce fallos callable a mensajes operativos
const getCabinInventoryErrorMessage = (error) => {
  if (error?.code === 'functions/permission-denied') {
    return 'Tu cuenta no tiene permisos para administrar insumos';
  }

  if (
    error?.code === 'functions/failed-precondition'
    || error?.code === 'functions/aborted'
  ) {
    return error.message || 'El insumo cambió y necesita actualizarse';
  }

  if (error?.code === 'functions/invalid-argument') {
    return error.message || 'Los datos del insumo necesitan revisión';
  }

  if (error?.code === 'functions/unavailable') {
    return 'No hay conexión con la administración de insumos';
  }

  return error?.message || 'No se pudo completar la operación de inventario';
};

// Ejecuta una orden y conserva su respuesta canónica
const runCabinInventoryCommand = async (payload) => {
  try {
    const response = await manageCabinSupplyCallable(payload);
    return response.data;
  } catch (error) {
    throw new Error(getCabinInventoryErrorMessage(error), { cause: error });
  }
};

// Reserva un identificador sin escribir datos
export const createCabinSupplyId = () => (
  doc(collection(db, 'insumosCabina')).id
);

// Crea un insumo con cantidad y valor inicial
export const createCabinSupply = (payload) => runCabinInventoryCommand({
  ...payload,
  action: 'create'
});

// Actualiza solamente los metadatos permitidos
export const updateCabinSupply = (payload) => runCabinInventoryCommand({
  ...payload,
  action: 'update'
});

// Cambia el estado sin eliminar historial
export const setCabinSupplyActive = (payload) => runCabinInventoryCommand({
  ...payload,
  action: 'set_active'
});

// Registra un movimiento transaccional de existencias
export const adjustCabinSupplyStock = (payload) => runCabinInventoryCommand({
  ...payload,
  action: 'adjust_stock'
});
