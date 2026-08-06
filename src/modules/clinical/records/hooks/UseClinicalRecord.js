import { useCallback, useEffect, useState } from 'react';
import {
  createClinicalOperationId,
  saveClinicalRecord
} from '../services/ClinicalRecordCommandService';
import { loadClinicalRecord } from '../services/ClinicalRecordQueryService';

// Controla la lectura y escritura protegida de una ficha
export const useClinicalRecord = ({ appointmentId, clientId }) => {
  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: true,
    isSaving: false,
    success: null
  });
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let active = true;

    loadClinicalRecord({ appointmentId, clientId })
      .then((data) => {
        if (active) setState((current) => ({ ...current, data, error: null, isLoading: false }));
      })
      .catch((error) => {
        if (active) setState((current) => ({ ...current, error: error.message, isLoading: false }));
      });

    // Ignora respuestas de una pantalla anterior
    return () => {
      active = false;
    };
  }, [appointmentId, clientId, loadVersion]);

  // Vuelve a cargar el documento vigente
  const reload = useCallback(() => {
    setState((current) => ({ ...current, error: null, isLoading: true, success: null }));
    setLoadVersion((current) => current + 1);
  }, []);

  // Guarda un borrador o una ficha completa
  const save = useCallback(async ({ record, status }) => {
    if (!state.data || state.isSaving) return null;

    setState((current) => ({ ...current, error: null, isSaving: true, success: null }));

    try {
      const result = await saveClinicalRecord({
        appointmentId,
        clientId,
        expectedRevision: state.data.revision,
        operationId: createClinicalOperationId(),
        record,
        status
      });
      setState((current) => ({
        ...current,
        data: {
          ...current.data,
          record,
          reviewedForAppointment: result.status === 'completed',
          revision: result.revision,
          status: result.status
        },
        isSaving: false,
        success: result.status === 'completed'
          ? 'Ficha técnica lista para esta cita'
          : 'Borrador guardado'
      }));
      return result;
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, isSaving: false }));
      return null;
    }
  }, [appointmentId, clientId, state.data, state.isSaving]);

  // Confirma la ficha vigente sin duplicar sus respuestas
  const confirmCurrentRecord = useCallback(() => {
    if (!state.data) return null;
    return save({ record: state.data.record, status: 'completed' });
  }, [save, state.data]);

  return { ...state, confirmCurrentRecord, reload, save };
};
