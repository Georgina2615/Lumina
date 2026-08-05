import { useCallback, useEffect, useState } from 'react';
import {
  createClinicalSessionOperationId,
  saveClinicalSession
} from '../services/ClinicalSessionCommandService';
import { uploadClinicalPhoto } from '../services/ClinicalSessionImageService';
import { loadClinicalSession } from '../services/ClinicalSessionQueryService';

// Controla la lectura imágenes y escritura del seguimiento
export const useClinicalSession = ({ appointmentId, clientId }) => {
  const [state, setState] = useState({
    data: null,
    error: '',
    isLoading: true,
    isSaving: false,
    success: ''
  });
  const [loadVersion, setLoadVersion] = useState(0);

  // Carga la sesión vinculada con la cita
  useEffect(() => {
    let active = true;

    loadClinicalSession({ appointmentId, clientId })
      .then((data) => {
        if (active) setState((current) => ({ ...current, data, error: '', isLoading: false }));
      })
      .catch((error) => {
        if (active) setState((current) => ({ ...current, data: null, error: error.message, isLoading: false }));
      });

    return () => {
      active = false;
    };
  }, [appointmentId, clientId, loadVersion]);

  // Vuelve a cargar la información vigente
  const reload = useCallback(() => {
    setState((current) => ({ ...current, error: '', isLoading: true, success: '' }));
    setLoadVersion((current) => current + 1);
  }, []);

  // Sube fotografías y guarda el seguimiento protegido
  const save = useCallback(async ({ files, session, status }) => {
    if (!state.data || state.isSaving) return null;

    setState((current) => ({ ...current, error: '', isSaving: true, success: '' }));

    try {
      const photoEntries = await Promise.all(['before', 'after'].map(async (kind) => {
        const file = files[kind];
        if (!file) return [kind, session.photos[`${kind}Path`]];

        const imagePath = await uploadClinicalPhoto({
          appointmentId,
          clientId,
          file,
          kind
        });
        return [kind, imagePath];
      }));
      const paths = Object.fromEntries(photoEntries);
      const savedSession = {
        ...session,
        photos: {
          afterPath: paths.after,
          beforePath: paths.before
        }
      };
      const result = await saveClinicalSession({
        appointmentId,
        clientId,
        expectedRevision: state.data.revision,
        operationId: createClinicalSessionOperationId(),
        session: savedSession,
        status
      });

      setState((current) => ({
        ...current,
        data: {
          ...current.data,
          revision: result.revision,
          session: savedSession,
          status: result.status
        },
        isSaving: false,
        success: result.status === 'completed'
          ? 'Seguimiento completado'
          : 'Borrador guardado'
      }));
      return result;
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, isSaving: false }));
      return null;
    }
  }, [appointmentId, clientId, state.data, state.isSaving]);

  return { ...state, reload, save };
};
