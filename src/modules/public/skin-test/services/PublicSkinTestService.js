import { httpsCallable } from 'firebase/functions';
import { functionsInstance } from '../../../../config/firebase';

const getSkinTestCall = httpsCallable(functionsInstance, 'getPublicSkinTest');
const evaluateSkinTestCall = httpsCallable(functionsInstance, 'evaluatePublicSkinTest');

// Traduce errores remotos a mensajes sencillos
const mapSkinTestError = (error) => {
  if (error?.code === 'functions/not-found') {
    return new Error('El test de piel no está disponible por el momento');
  }
  if (error?.code === 'functions/failed-precondition') {
    return new Error('El test se actualizó Recarga la página para comenzar nuevamente');
  }
  if (error?.code === 'functions/invalid-argument') {
    return new Error(error.message || 'Revisa que todas las preguntas tengan respuesta');
  }
  return new Error('No pudimos completar el test de piel');
};

// Carga únicamente las preguntas publicadas
export const loadPublicSkinTest = async () => {
  try {
    const response = await getSkinTestCall();
    return response.data;
  } catch (error) {
    throw mapSkinTestError(error);
  }
};

// Solicita una orientación calculada en el servidor
export const evaluatePublicSkinTest = async (payload) => {
  try {
    const response = await evaluateSkinTestCall(payload);
    return response.data;
  } catch (error) {
    throw mapSkinTestError(error);
  }
};
