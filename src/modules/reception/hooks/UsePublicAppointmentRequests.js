import { useCallback, useEffect, useState } from 'react';
import {
  getPublicRequestProofFile,
  reviewPublicAppointmentRequest,
  subscribePendingPublicRequests
} from '../services/PublicAppointmentRequestService';

// Controla la lista y sus acciones
export const usePublicAppointmentRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => subscribePendingPublicRequests({
    onData: (nextRequests) => {
      setRequests(nextRequests);
      setLoading(false);
      setError('');
    },
    onError: () => {
      setLoading(false);
      setError('No pudimos cargar las solicitudes por internet');
    }
  }), []);

  // Ejecuta una revisión protegida
  const reviewRequest = useCallback(async ({ requestId, action, reason = '' }) => {
    setProcessingId(requestId);
    setError('');
    try {
      return await reviewPublicAppointmentRequest({
        requestId,
        action,
        reason
      });
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    } finally {
      setProcessingId(null);
    }
  }, []);

  // Devuelve el estado completo de la pantalla
  return {
    requests,
    loading,
    error,
    processingId,
    clearError: () => setError(''),
    loadProof: getPublicRequestProofFile,
    approveRequest: (requestId) => reviewRequest({
      requestId,
      action: 'approve'
    }),
    rejectRequest: (requestId, reason) => reviewRequest({
      requestId,
      action: 'reject',
      reason
    })
  };
};

// Escucha únicamente la cantidad pendiente
export const usePublicAppointmentRequestCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => subscribePendingPublicRequests({
    onData: (requests) => setCount(requests.length),
    onError: () => setCount(0)
  }), []);

  return count;
};
