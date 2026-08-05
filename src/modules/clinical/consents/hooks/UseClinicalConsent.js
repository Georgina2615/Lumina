import { useCallback, useEffect, useState } from 'react';
import {
  createClinicalConsentOperationId,
  loadClinicalConsent,
  signClinicalConsent,
  uploadClinicalConsentSignature
} from '../services/ClinicalConsentService';

// Controla la consulta y firma del consentimiento
export const useClinicalConsent = ({ appointmentId, clientId }) => {
  const [state, setState] = useState({
    data: null,
    error: '',
    isLoading: true,
    isSaving: false
  });
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadClinicalConsent({ appointmentId, clientId })
      .then((data) => active && setState({ data, error: '', isLoading: false, isSaving: false }))
      .catch((error) => active && setState({ data: null, error: error.message, isLoading: false, isSaving: false }));
    return () => {
      active = false;
    };
  }, [appointmentId, clientId, loadVersion]);

  // Vuelve a consultar el consentimiento vigente
  const reload = useCallback(() => {
    setState((current) => ({ ...current, error: '', isLoading: true }));
    setLoadVersion((current) => current + 1);
  }, []);

  // Sube la firma y registra la aceptación inmutable
  const sign = useCallback(async ({ canvas, choices, statementIds }) => {
    if (!state.data || state.isSaving) return false;
    setState((current) => ({ ...current, error: '', isSaving: true }));
    try {
      const signaturePath = await uploadClinicalConsentSignature({
        appointmentId,
        canvas,
        clientId
      });
      await signClinicalConsent({
        acceptedStatementIds: statementIds,
        appointmentId,
        clientId,
        clinicalPhotosAllowed: choices.clinical,
        marketingPhotosAllowed: choices.marketing,
        operationId: createClinicalConsentOperationId(),
        signaturePath,
        templateHash: state.data.template.contentHash,
        templateId: state.data.template.id
      });
      setState((current) => ({
        ...current,
        data: {
          ...current.data,
          consent: {
            clinicalPhotosAllowed: choices.clinical,
            marketingPhotosAllowed: choices.marketing,
            status: 'signed'
          }
        },
        isSaving: false
      }));
      return true;
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, isSaving: false }));
      return false;
    }
  }, [appointmentId, clientId, state.data, state.isSaving]);

  return { ...state, reload, sign };
};
