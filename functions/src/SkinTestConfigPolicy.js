import { createHash } from 'node:crypto';

export const SKIN_RESULT_KEYS = Object.freeze([
  'basica',
  'profunda',
  'acne',
  'manchas',
  'edad'
]);

const resultKeySet = new Set(SKIN_RESULT_KEYS);
const identifierPattern = /^[A-Za-z0-9_-]{3,128}$/;

// Representa un error esperado de configuración
export class SkinTestConfigError extends Error {
  // Conserva el código compatible con Functions
  constructor(code, message) {
    super(message);
    this.name = 'SkinTestConfigError';
    this.code = code;
  }
}

// Detiene una solicitud inválida
const fail = (code, message) => {
  throw new SkinTestConfigError(code, message);
};

// Normaliza texto visible con límites seguros
const requireText = (value, minimum, maximum, message) => {
  const text = typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ')
    : '';
  if (text.length < minimum || text.length > maximum) fail('invalid-argument', message);
  return text;
};

// Normaliza una identidad estable
const requireId = (value, message) => {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!identifierPattern.test(id)) fail('invalid-argument', message);
  return id;
};

// Normaliza una respuesta del cuestionario
const requireOption = (option) => {
  const source = option && typeof option === 'object' ? option : {};
  if (Object.keys(source).sort().join(',') !== 'id,label,points,requiresContact,resultKey') {
    fail('invalid-argument', 'Una respuesta contiene información no permitida');
  }
  if (!resultKeySet.has(source.resultKey)) {
    fail('invalid-argument', 'La recomendación de una respuesta no es válida');
  }
  if (!Number.isSafeInteger(source.points) || source.points < 0 || source.points > 3) {
    fail('invalid-argument', 'La importancia de una respuesta no es válida');
  }
  if (typeof source.requiresContact !== 'boolean') {
    fail('invalid-argument', 'La orientación de una respuesta no es válida');
  }
  return {
    id: requireId(source.id, 'La respuesta no es válida'),
    label: requireText(source.label, 2, 120, 'Escribe una respuesta válida'),
    points: source.points,
    requiresContact: source.requiresContact,
    resultKey: source.resultKey
  };
};

// Normaliza una pregunta completa
const requireQuestion = (question, index) => {
  const source = question && typeof question === 'object' ? question : {};
  if (Object.keys(source).sort().join(',') !== 'id,options,order,text') {
    fail('invalid-argument', 'Una pregunta contiene información no permitida');
  }
  if (!Array.isArray(source.options) || source.options.length < 2 || source.options.length > 5) {
    fail('invalid-argument', 'Cada pregunta necesita entre dos y cinco respuestas');
  }
  const options = source.options.map(requireOption);
  if (new Set(options.map(({ id }) => id)).size !== options.length) {
    fail('invalid-argument', 'Una pregunta contiene respuestas repetidas');
  }
  return {
    id: requireId(source.id, 'La pregunta no es válida'),
    options,
    order: index + 1,
    text: requireText(source.text, 8, 180, 'Escribe una pregunta válida')
  };
};

// Normaliza una recomendación final
const requireResult = (result) => {
  const source = result && typeof result === 'object' ? result : {};
  if (Object.keys(source).sort().join(',') !== 'productIds,serviceId,summary,title') {
    fail('invalid-argument', 'Una recomendación contiene información no permitida');
  }
  if (!Array.isArray(source.productIds) || source.productIds.length > 3) {
    fail('invalid-argument', 'Selecciona hasta tres productos por recomendación');
  }
  const productIds = source.productIds.map((id) => requireId(id, 'Un producto no es válido'));
  if (new Set(productIds).size !== productIds.length) {
    fail('invalid-argument', 'Una recomendación contiene productos repetidos');
  }
  const serviceId = source.serviceId === ''
    ? ''
    : requireId(source.serviceId, 'El servicio recomendado no es válido');
  return {
    productIds,
    serviceId,
    summary: requireText(source.summary, 20, 300, 'Escribe una explicación válida'),
    title: requireText(source.title, 3, 80, 'Escribe un título válido')
  };
};

// Valida una configuración completa
export const validateSkinTestConfigRequest = (data) => {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  if (Object.keys(source).sort().join(',') !== 'active,expectedRevision,operationId,questions,results') {
    fail('invalid-argument', 'La solicitud contiene información no permitida');
  }
  if (typeof source.active !== 'boolean') fail('invalid-argument', 'El estado no es válido');
  if (!Number.isSafeInteger(source.expectedRevision) || source.expectedRevision < 0) {
    fail('invalid-argument', 'La revisión no es válida');
  }
  if (!Array.isArray(source.questions) || source.questions.length < 3 || source.questions.length > 10) {
    fail('invalid-argument', 'El test necesita entre tres y diez preguntas');
  }
  const questions = source.questions.map(requireQuestion);
  if (new Set(questions.map(({ id }) => id)).size !== questions.length) {
    fail('invalid-argument', 'El test contiene preguntas repetidas');
  }
  const resultsSource = source.results && typeof source.results === 'object' ? source.results : {};
  if (Object.keys(resultsSource).sort().join(',') !== [...SKIN_RESULT_KEYS].sort().join(',')) {
    fail('invalid-argument', 'Configura las cinco recomendaciones');
  }
  const results = Object.fromEntries(SKIN_RESULT_KEYS.map((key) => [
    key,
    requireResult(resultsSource[key])
  ]));
  if (source.active && Object.values(results).some(({ serviceId }) => !serviceId)) {
    fail('failed-precondition', 'Selecciona un servicio para cada recomendación');
  }
  return {
    active: source.active,
    expectedRevision: source.expectedRevision,
    operationId: requireId(source.operationId, 'La operación no es válida'),
    questions,
    results
  };
};

// Crea una huella estable para reintentos
export const buildSkinTestConfigHash = (request) => (
  createHash('sha256').update(JSON.stringify(request)).digest('hex')
);
