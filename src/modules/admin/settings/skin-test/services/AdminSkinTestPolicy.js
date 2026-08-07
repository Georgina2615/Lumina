import { skinResultOptions } from './AdminSkinTestDefaults';

const validResultKeys = new Set(skinResultOptions.map(({ key }) => key));

// Crea una identidad local segura
export const createSkinTestId = (prefix) => (
  `${prefix}-${globalThis.crypto.randomUUID()}`
);

// Valida el borrador antes de enviarlo
export const validateSkinTestDraft = (draft) => {
  if (draft.questions.length < 3 || draft.questions.length > 10) {
    return 'El test necesita entre tres y diez preguntas';
  }
  for (const question of draft.questions) {
    if (question.text.trim().length < 8) return 'Completa el texto de todas las preguntas';
    if (question.options.length < 2 || question.options.length > 5) {
      return 'Cada pregunta necesita entre dos y cinco respuestas';
    }
    for (const option of question.options) {
      if (option.label.trim().length < 2 || !validResultKeys.has(option.resultKey)) {
        return 'Completa todas las respuestas y sus recomendaciones';
      }
    }
  }
  for (const result of Object.values(draft.results)) {
    if (result.title.trim().length < 3 || result.summary.trim().length < 20) {
      return 'Completa el título y la explicación de cada resultado';
    }
    if (draft.active && !result.serviceId) {
      return 'Selecciona un servicio para cada resultado antes de publicar';
    }
  }
  return null;
};

// Prepara el contrato exacto del servidor
export const buildSkinTestCommand = (draft) => ({
  active: draft.active,
  expectedRevision: draft.revision,
  operationId: globalThis.crypto.randomUUID(),
  questions: draft.questions.map((question, index) => ({
    id: question.id,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label.trim(),
      points: Number(option.points),
      requiresContact: option.requiresContact,
      resultKey: option.resultKey
    })),
    order: index + 1,
    text: question.text.trim()
  })),
  results: Object.fromEntries(Object.entries(draft.results).map(([key, result]) => [key, {
    productIds: result.productIds,
    serviceId: result.serviceId,
    summary: result.summary.trim(),
    title: result.title.trim()
  }]))
});
