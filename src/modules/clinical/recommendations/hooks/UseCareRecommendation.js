import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildCareRecommendationPayload, filterRecommendationProducts } from '../services/CareRecommendationPolicy';
import {
  createCareRecommendationOperationId,
  loadCareRecommendation,
  saveCareRecommendation
} from '../services/CareRecommendationService';

const emptyFields = { careInstructions: '', nextVisitDate: '', serviceId: '' };

// Controla la edición de recomendaciones por cita
export const useCareRecommendation = ({ appointmentId, clientId }) => {
  const [state, setState] = useState({ data: null, error: '', isLoading: true, isSaving: false, success: '' });
  const [fields, setFields] = useState(emptyFields);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [search, setSearch] = useState('');
  const [loadVersion, setLoadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    loadCareRecommendation({ appointmentId, clientId })
      .then((data) => {
        if (!active) return;
        const stored = data.recommendation;
        setFields({
          careInstructions: String(stored?.careInstructions ?? ''),
          nextVisitDate: String(stored?.nextVisitDate ?? ''),
          serviceId: String(stored?.recommendedService?.id ?? '')
        });
        setSelectedProductIds(stored?.products?.map(({ id }) => id) ?? []);
        setState({ data, error: '', isLoading: false, isSaving: false, success: '' });
      })
      .catch((error) => active && setState({ data: null, error: error.message, isLoading: false, isSaving: false, success: '' }));
    return () => {
      active = false;
    };
  }, [appointmentId, clientId, loadVersion]);

  const products = useMemo(() => filterRecommendationProducts(state.data?.products ?? [], search), [search, state.data]);
  const changeField = (event) => setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
  const toggleProduct = (productId) => setSelectedProductIds((current) => (
    current.includes(productId)
      ? current.filter((id) => id !== productId)
      : current.length < 8 ? [...current, productId] : current
  ));
  const reload = useCallback(() => {
    setState((current) => ({ ...current, error: '', isLoading: true }));
    setLoadVersion((current) => current + 1);
  }, []);

  const save = async () => {
    if (!state.data || state.isSaving) return;
    try {
      const recommendation = buildCareRecommendationPayload({ fields, selectedProductIds });
      setState((current) => ({ ...current, error: '', isSaving: true, success: '' }));
      const result = await saveCareRecommendation({
        appointmentId,
        clientId,
        expectedRevision: state.data.recommendation?.revision ?? 0,
        operationId: createCareRecommendationOperationId(),
        recommendation
      });
      setState((current) => ({
        ...current,
        data: { ...current.data, recommendation: { ...recommendation, revision: result.revision } },
        isSaving: false,
        success: 'Recomendaciones guardadas'
      }));
    } catch (error) {
      setState((current) => ({ ...current, error: error.message, isSaving: false }));
    }
  };

  return { ...state, changeField, fields, products, reload, save, search, selectedProductIds, setSearch, toggleProduct };
};
