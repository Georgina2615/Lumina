import { useCallback, useEffect, useState } from 'react';
import {
  evaluatePublicSkinTest,
  loadPublicSkinTest
} from '../services/PublicSkinTestService';

// Controla el recorrido del test público
export const usePublicSkinTest = () => {
  const [questionnaire, setQuestionnaire] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');

  // Carga una fotografía estable del cuestionario
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setQuestionnaire(await loadPublicSkinTest());
    } catch (loadError) {
      setQuestionnaire(null);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    loadPublicSkinTest()
      .then((response) => active && setQuestionnaire(response))
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const questions = questionnaire?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] ?? '' : '';
  const progress = questions.length > 0
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  // Guarda una respuesta local sin datos personales
  const selectOption = (optionId) => {
    setAnswers((current) => ({ ...current, [currentQuestion.id]: optionId }));
    setError('');
  };

  // Regresa una pregunta sin borrar respuestas
  const goBack = () => {
    setCurrentIndex((current) => Math.max(current - 1, 0));
    setError('');
  };

  // Envía respuestas cuando termina el recorrido
  const continueTest = async () => {
    if (!selectedOptionId) {
      setError('Selecciona una respuesta para continuar');
      return;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setError('');
      return;
    }
    setEvaluating(true);
    setError('');
    try {
      const response = await evaluatePublicSkinTest({
        answers: questions.map(({ id }) => ({
          optionId: answers[id],
          questionId: id
        })),
        revision: questionnaire.revision
      });
      setResult(response);
    } catch (evaluationError) {
      setError(evaluationError.message);
    } finally {
      setEvaluating(false);
    }
  };

  // Reinicia el recorrido con la misma versión
  const restart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setStarted(false);
    setError('');
  };

  return {
    continueTest,
    currentIndex,
    currentQuestion,
    error,
    evaluating,
    goBack,
    load,
    loading,
    progress,
    questionsCount: questions.length,
    restart,
    result,
    selectOption,
    selectedOptionId,
    setStarted,
    started
  };
};
