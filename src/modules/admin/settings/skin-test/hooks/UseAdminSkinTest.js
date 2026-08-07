import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buildSkinTestCommand,
  createSkinTestId,
  validateSkinTestDraft
} from '../services/AdminSkinTestPolicy';
import {
  loadAdminSkinTest,
  saveAdminSkinTest
} from '../services/AdminSkinTestService';

// Controla la edición completa del test de piel
export const useAdminSkinTest = () => {
  const [draft, setDraft] = useState(null);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const requestRef = useRef(0);

  // Carga el formulario y descarta respuestas anteriores
  const refresh = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoading(true);
    setError('');
    try {
      const result = await loadAdminSkinTest();
      if (requestRef.current !== requestId) return;
      setDraft(result.config);
      setProducts(result.products);
      setServices(result.services);
    } catch {
      if (requestRef.current === requestId) {
        setError('No pudimos cargar la configuración del test');
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    loadAdminSkinTest()
      .then((result) => {
        if (requestRef.current !== requestId) return;
        setDraft(result.config);
        setProducts(result.products);
        setServices(result.services);
      })
      .catch(() => {
        if (requestRef.current === requestId) {
          setError('No pudimos cargar la configuración del test');
        }
      })
      .finally(() => {
        if (requestRef.current === requestId) setLoading(false);
      });
    return () => {
      requestRef.current += 1;
    };
  }, []);

  // Actualiza una pregunta sin tocar las demás
  const updateQuestion = useCallback((questionId, patch) => {
    setFeedback('');
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => (
        question.id === questionId ? { ...question, ...patch } : question
      ))
    }));
  }, []);

  // Actualiza una respuesta específica
  const updateOption = useCallback((questionId, optionId, patch) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => question.id === questionId
        ? {
          ...question,
          options: question.options.map((option) => option.id === optionId
            ? { ...option, ...patch }
            : option)
        }
        : question)
    }));
  }, []);

  // Agrega una pregunta editable
  const addQuestion = useCallback(() => {
    setDraft((current) => current.questions.length >= 10 ? current : ({
      ...current,
      questions: [...current.questions, {
        id: createSkinTestId('pregunta'),
        options: [
          {
            id: createSkinTestId('respuesta'),
            label: 'Primera respuesta',
            points: 1,
            requiresContact: false,
            resultKey: 'basica'
          },
          {
            id: createSkinTestId('respuesta'),
            label: 'Segunda respuesta',
            points: 1,
            requiresContact: false,
            resultKey: 'basica'
          }
        ],
        order: current.questions.length + 1,
        text: 'Escribe la nueva pregunta'
      }]
    }));
  }, []);

  // Elimina una pregunta cuando permanece el mínimo
  const removeQuestion = useCallback((questionId) => {
    setDraft((current) => current.questions.length <= 3 ? current : ({
      ...current,
      questions: current.questions.filter(({ id }) => id !== questionId)
    }));
  }, []);

  // Mueve una pregunta dentro del recorrido
  const moveQuestion = useCallback((questionId, direction) => {
    setDraft((current) => {
      const index = current.questions.findIndex(({ id }) => id === questionId);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= current.questions.length) return current;
      const questions = [...current.questions];
      [questions[index], questions[destination]] = [questions[destination], questions[index]];
      return { ...current, questions };
    });
  }, []);

  // Agrega una respuesta a una pregunta
  const addOption = useCallback((questionId) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => (
        question.id !== questionId || question.options.length >= 5
          ? question
          : {
            ...question,
            options: [...question.options, {
              id: createSkinTestId('respuesta'),
              label: 'Nueva respuesta',
              points: 1,
              requiresContact: false,
              resultKey: 'basica'
            }]
          }
      ))
    }));
  }, []);

  // Elimina una respuesta sin dejar la pregunta incompleta
  const removeOption = useCallback((questionId, optionId) => {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((question) => (
        question.id !== questionId || question.options.length <= 2
          ? question
          : {
            ...question,
            options: question.options.filter(({ id }) => id !== optionId)
          }
      ))
    }));
  }, []);

  // Actualiza una recomendación final
  const updateResult = useCallback((resultKey, patch) => {
    setDraft((current) => ({
      ...current,
      results: {
        ...current.results,
        [resultKey]: { ...current.results[resultKey], ...patch }
      }
    }));
  }, []);

  // Guarda una revisión completa
  const save = useCallback(async () => {
    const validationError = validateSkinTestDraft(draft);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const result = await saveAdminSkinTest(buildSkinTestCommand(draft));
      setDraft((current) => ({ ...current, revision: result.revision }));
      setFeedback(draft.active
        ? 'Test publicado correctamente'
        : 'Borrador guardado correctamente');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }, [draft]);

  return {
    addOption,
    addQuestion,
    draft,
    error,
    feedback,
    loading,
    moveQuestion,
    products,
    refresh,
    removeOption,
    removeQuestion,
    save,
    saving,
    services,
    setActive: (active) => setDraft((current) => ({ ...current, active })),
    setError,
    updateOption,
    updateQuestion,
    updateResult
  };
};
