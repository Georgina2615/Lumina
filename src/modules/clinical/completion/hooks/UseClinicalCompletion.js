import { useCallback, useEffect, useRef, useState } from 'react';
import {
  completeClinicalAttention,
  createClinicalCompletionOperationId,
  loadClinicalCompletion
} from '../services/ClinicalCompletionService';

// Controla la verificación y cierre de una atención
export const useClinicalCompletion = ({ appointmentId, clientId }) => {
  const [state, setState] = useState({ data: null, error: '', isLoading: true, isSaving: false, success: false });
  const [loadVersion, setLoadVersion] = useState(0);
  const operationId = useRef(createClinicalCompletionOperationId());

  useEffect(() => {
    let active = true;
    loadClinicalCompletion({ appointmentId, clientId })
      .then((data) => active && setState({ data, error: '', isLoading: false, isSaving: false, success: false }))
      .catch((error) => active && setState({ data: null, error: error.message, isLoading: false, isSaving: false, success: false }));
    return () => {
      active = false;
    };
  }, [appointmentId, clientId, loadVersion]);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, error: '', isLoading: true }));
    setLoadVersion((current) => current + 1);
  }, []);

  const complete = async () => {
    if (!state.data?.ready || state.isSaving) return;
    try {
      setState((current) => ({ ...current, error: '', isSaving: true }));
      await completeClinicalAttention({ appointmentId, operationId: operationId.current });
      setState((current) => ({ ...current, isSaving: false, success: true }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, isSaving: false }));
    }
  };

  return { ...state, complete, reload };
};
