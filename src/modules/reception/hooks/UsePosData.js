import { useCallback, useEffect, useState } from 'react';
import {
  subscribePOSAppointment,
  subscribePOSRecommendation,
  subscribeRetailProducts
} from '../services/POSDataService';

// Obtiene un mensaje seguro para la interfaz
const getDataErrorMessage = (error, fallback) => {
  // Explica permisos insuficientes
  if (error?.code === 'permission-denied') {
    // Devuelve el mensaje de permisos
    return 'No tienes permisos para consultar esta información';
  }
  // Explica conexión ausente
  if (error?.code === 'unavailable') {
    // Devuelve el mensaje de conexión
    return 'No hay conexión con la base de datos';
  }
  // Devuelve el mensaje más útil
  return error?.message || fallback;
};

// Mantiene sincronizados catálogo y cita
export const usePOSData = (appointmentId) => {
  // Conserva el estado del catálogo
  const [productState, setProductState] = useState({
    data: [],
    error: null,
    loading: true
  });
  // Conserva el estado de la cita
  const [appointmentState, setAppointmentState] = useState({
    appointmentId: null,
    data: null,
    error: null
  });
  const [recommendationState, setRecommendationState] = useState({
    appointmentId: null,
    data: null,
    error: null
  });
  // Controla reintentos explícitos
  const [reloadVersion, setReloadVersion] = useState(0);
  // Verifica la ruta antes de consultar
  const validAppointmentId = !appointmentId
    || /^[A-Za-z0-9_-]{1,128}$/.test(appointmentId);
  // Expone solo la cita solicitada
  const currentAppointmentState = appointmentState.appointmentId
    === appointmentId
    ? appointmentState
    : null;

  // Reinicia ambas suscripciones bajo demanda
  const retry = useCallback(() => {
    setProductState((current) => ({
      ...current,
      error: null,
      loading: true
    }));
    setAppointmentState({
      appointmentId: null,
      data: null,
      error: null
    });
    setRecommendationState({ appointmentId: null, data: null, error: null });
    setReloadVersion((current) => current + 1);
  }, []);

  // Escucha únicamente productos comerciales activos
  useEffect(() => {
    // Abre la suscripción del catálogo
    const unsubscribe = subscribeRetailProducts({
      onData: (nextProducts) => {
        setProductState({
          data: nextProducts,
          error: null,
          loading: false
        });
      },
      onError: (error) => {
        setProductState((current) => ({
          ...current,
          error: getDataErrorMessage(
            error,
            'No se pudo cargar el catálogo'
          ),
          loading: false
        }));
      }
    });
    // Libera la suscripción anterior
    return unsubscribe;
  }, [reloadVersion]);

  // Escucha la cita indicada en la dirección
  useEffect(() => {
    // Evita consultas sin identificador válido
    if (!appointmentId || !validAppointmentId) {
      // Devuelve ausencia de limpieza
      return undefined;
    }

    // Devuelve la limpieza de la cita
    return subscribePOSAppointment({
      appointmentId,
      onData: (nextAppointment) => {
        setAppointmentState({
          appointmentId,
          data: nextAppointment,
          error: null
        });
      },
      onError: (error) => {
        setAppointmentState({
          appointmentId,
          data: null,
          error: getDataErrorMessage(error, 'No se pudo cargar la cita')
        });
      }
    });
  }, [appointmentId, reloadVersion, validAppointmentId]);

  // Escucha recomendaciones solo dentro de un cobro con cita
  useEffect(() => {
    if (!appointmentId || !validAppointmentId) return undefined;
    return subscribePOSRecommendation({
      appointmentId,
      onData: (data) => setRecommendationState({ appointmentId, data, error: null }),
      onError: (error) => setRecommendationState({
        appointmentId,
        data: null,
        error: getDataErrorMessage(error, 'No se pudieron cargar las recomendaciones')
      })
    });
  }, [appointmentId, reloadVersion, validAppointmentId]);

  // Devuelve estados externos normalizados
  return {
    appointment: currentAppointmentState?.data ?? null,
    appointmentError: validAppointmentId
      ? currentAppointmentState?.error ?? null
      : 'El identificador de la cita no es válido',
    appointmentLoading: Boolean(
      appointmentId && validAppointmentId && !currentAppointmentState
    ),
    products: productState.data,
    productsError: productState.error,
    productsLoading: productState.loading,
    recommendation: recommendationState.appointmentId === appointmentId
      ? recommendationState.data
      : null,
    recommendationError: recommendationState.appointmentId === appointmentId
      ? recommendationState.error
      : null,
    retry
  };
};
