import { SKIN_RESULT_KEYS } from './SkinTestConfigPolicy.js';

const identifierPattern = /^[A-Za-z0-9_-]{3,128}$/;

// Representa un error esperado del test público
export class PublicSkinTestError extends Error {
  // Conserva el código compatible con Functions
  constructor(code, message) {
    super(message);
    this.name = 'PublicSkinTestError';
    this.code = code;
  }
}

// Detiene una solicitud inválida
const fail = (code, message) => {
  throw new PublicSkinTestError(code, message);
};

// Exige una configuración publicada
export const requirePublishedSkinTest = (snapshot) => {
  const config = snapshot.exists ? snapshot.data() : null;
  if (
    config?.activo !== true
    || config?.schemaVersion !== 1
    || !Number.isSafeInteger(config?.revision)
    || !Array.isArray(config?.preguntas)
    || !config?.recomendaciones
  ) {
    fail('not-found', 'El test de piel no está disponible');
  }
  return config;
};

// Oculta puntajes y reglas internas
export const buildPublicSkinQuestionnaire = (config) => ({
  questions: [...config.preguntas]
    .sort((first, second) => first.order - second.order)
    .map((question) => ({
      id: question.id,
      options: question.options.map(({ id, label }) => ({ id, label })),
      order: question.order,
      text: question.text
    })),
  revision: config.revision
});

// Valida respuestas contra la versión publicada
export const validatePublicSkinAnswers = (data, config) => {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  if (Object.keys(source).sort().join(',') !== 'answers,revision') {
    fail('invalid-argument', 'La solicitud contiene información no permitida');
  }
  if (source.revision !== config.revision) {
    fail('failed-precondition', 'El test cambió y necesita comenzar nuevamente');
  }
  if (!Array.isArray(source.answers) || source.answers.length !== config.preguntas.length) {
    fail('invalid-argument', 'Responde todas las preguntas');
  }
  const answers = new Map();
  source.answers.forEach((answer) => {
    const questionId = typeof answer?.questionId === 'string' ? answer.questionId.trim() : '';
    const optionId = typeof answer?.optionId === 'string' ? answer.optionId.trim() : '';
    if (
      Object.keys(answer ?? {}).sort().join(',') !== 'optionId,questionId'
      || !identifierPattern.test(questionId)
      || !identifierPattern.test(optionId)
      || answers.has(questionId)
    ) {
      fail('invalid-argument', 'Una respuesta no es válida');
    }
    answers.set(questionId, optionId);
  });
  return answers;
};

// Calcula una orientación determinista
export const calculatePublicSkinResult = (config, answers) => {
  const scores = Object.fromEntries(SKIN_RESULT_KEYS.map((key) => [key, 0]));
  let requiresContact = false;
  config.preguntas.forEach((question) => {
    const option = question.options.find(({ id }) => id === answers.get(question.id));
    if (!option || !SKIN_RESULT_KEYS.includes(option.resultKey)) {
      fail('invalid-argument', 'Una respuesta no pertenece al test');
    }
    scores[option.resultKey] += option.points;
    requiresContact ||= option.requiresContact === true;
  });
  const resultKey = SKIN_RESULT_KEYS.reduce((selected, key) => (
    scores[key] > scores[selected] ? key : selected
  ), SKIN_RESULT_KEYS[0]);
  return {
    recommendation: config.recomendaciones[resultKey],
    requiresContact,
    resultKey
  };
};
