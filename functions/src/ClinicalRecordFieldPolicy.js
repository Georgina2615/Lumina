const MAXIMUM_LONG_TEXT = 2000;
const MAXIMUM_SHORT_TEXT = 300;

const optionSets = Object.freeze({
  alcohol: new Set(['', 'never', 'occasional', 'frequent']),
  coffee: new Set(['', 'never', 'occasional', 'frequent']),
  coloration: new Set(['', 'normal', 'reddish', 'grayish', 'yellowish']),
  diet: new Set(['', 'balanced', 'irregular', 'other']),
  digestion: new Set(['', 'normal', 'irregular']),
  eyeArea: new Set(['edema', 'atrophic', 'other']),
  flaccidity: new Set(['eyelids', 'chin', 'oval', 'cheeks']),
  generalHealth: new Set(['', 'good', 'regular', 'requires_attention']),
  hydration: new Set(['', 'normal', 'dehydrated', 'very_dehydrated', 'hyperhydrated']),
  lesions: new Set(['comedones', 'papules', 'pustules']),
  muscleTone: new Set(['', 'good', 'medium', 'poor']),
  pigmentation: new Set(['freckles', 'nevi', 'photosensitive_hyperpigmentation', 'melasma', 'lentigines', 'achromia']),
  pores: new Set(['normal', 'dilated', 'occluded']),
  precautions: new Set(['diabetes', 'epilepsy', 'asthma', 'heart_condition', 'edema', 'thrombosis_phlebitis', 'blood_pressure', 'hepatitis_blood_infection', 'skin_condition']),
  pregnancyStatus: new Set(['', 'none', 'pregnant', 'breastfeeding']),
  scars: new Set(['atrophic', 'hypertrophic', 'keloid', 'other']),
  sebum: new Set(['', 'normal', 'alipic', 'seborrheic', 'mixed']),
  shine: new Set(['', 'balanced', 'shiny_areas', 'matte_areas', 'mixed']),
  skinTypes: new Set(['normal', 'dry', 'oily', 'dehydrated_oily', 'occluded', 'sensitive']),
  sunExposure: new Set(['', 'low', 'moderate', 'high']),
  texture: new Set(['normal', 'fine', 'thick', 'rough', 'soft']),
  tobacco: new Set(['', 'never', 'occasional', 'frequent']),
  vascularization: new Set(['erythema', 'telangiectasia', 'couperose']),
  wrinkles: new Set(['chest', 'neck', 'malar', 'zygomatic', 'eye_orbicular']),
  acneFactors: new Set(['hormonal', 'comedogenic', 'juvenile', 'inadequate_cosmetics', 'other'])
});

// Representa un error esperado del expediente
export class ClinicalRecordError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ClinicalRecordError';
    this.code = code;
  }
}

// Detiene una solicitud inválida
export const failClinicalRecord = (code, message) => {
  throw new ClinicalRecordError(code, message);
};

// Comprueba la forma exacta de una sección
const requireExactFields = (source, fields, label) => {
  if (
    !source
    || typeof source !== 'object'
    || Array.isArray(source)
    || Object.keys(source).length !== fields.length
    || fields.some((field) => !Object.hasOwn(source, field))
  ) {
    failClinicalRecord('invalid-argument', `${label} está incompleta`);
  }
};

// Normaliza texto limitado
const requireText = (value, maximum = MAXIMUM_SHORT_TEXT) => {
  if (typeof value !== 'string') {
    failClinicalRecord('invalid-argument', 'La ficha contiene texto no válido');
  }

  const normalized = value.trim().replace(/\s+/g, ' ');

  if (normalized.length > maximum) {
    failClinicalRecord('invalid-argument', 'Una respuesta es demasiado extensa');
  }

  return normalized;
};

// Normaliza una cantidad entera
const requireInteger = (value, maximum) => {
  if (!Number.isSafeInteger(value) || value < 0 || value > maximum) {
    failClinicalRecord('invalid-argument', 'Una cantidad no es válida');
  }

  return value;
};

// Normaliza una opción controlada
const requireOption = (value, optionName) => {
  if (!optionSets[optionName].has(value)) {
    failClinicalRecord('invalid-argument', 'Una opción seleccionada no es válida');
  }

  return value;
};

// Normaliza una lista controlada sin repetidos
const requireOptions = (value, optionName) => {
  if (
    !Array.isArray(value)
    || value.length > optionSets[optionName].size
    || value.some((item) => !optionSets[optionName].has(item))
    || new Set(value).size !== value.length
  ) {
    failClinicalRecord('invalid-argument', 'Una selección múltiple no es válida');
  }

  return [...value].sort();
};

// Normaliza una fecha civil opcional
const requireDate = (value) => {
  if (value === '') return '';

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    failClinicalRecord('invalid-argument', 'La fecha de nacimiento no es válida');
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    failClinicalRecord('invalid-argument', 'La fecha de nacimiento no es válida');
  }

  return value;
};

// Normaliza los datos personales
export const normalizePersonalDetails = (source) => {
  const fields = ['birthDate', 'address', 'occupation', 'pregnancies', 'cesareans', 'surgeries', 'hysterectomy', 'otherProcedures'];
  requireExactFields(source, fields, 'Los datos personales');

  if (typeof source.hysterectomy !== 'boolean') {
    failClinicalRecord('invalid-argument', 'La respuesta de histerectomía no es válida');
  }

  return {
    address: requireText(source.address, 500),
    birthDate: requireDate(source.birthDate),
    cesareans: requireInteger(source.cesareans, 20),
    hysterectomy: source.hysterectomy,
    occupation: requireText(source.occupation),
    otherProcedures: requireText(source.otherProcedures, 1000),
    pregnancies: requireInteger(source.pregnancies, 30),
    surgeries: requireText(source.surgeries, 1000)
  };
};

// Normaliza hábitos y antecedentes
export const normalizeHistory = (source) => {
  const fields = ['waterGlasses', 'alcohol', 'coffee', 'tobacco', 'diet', 'digestion', 'generalHealth', 'sunExposure', 'pregnancyStatus', 'allergies', 'medications', 'previousTreatments', 'currentRoutine'];
  requireExactFields(source, fields, 'Los antecedentes');

  return {
    alcohol: requireOption(source.alcohol, 'alcohol'),
    allergies: requireText(source.allergies, 1000),
    coffee: requireOption(source.coffee, 'coffee'),
    currentRoutine: requireText(source.currentRoutine, MAXIMUM_LONG_TEXT),
    diet: requireOption(source.diet, 'diet'),
    digestion: requireOption(source.digestion, 'digestion'),
    generalHealth: requireOption(source.generalHealth, 'generalHealth'),
    medications: requireText(source.medications, 1000),
    pregnancyStatus: requireOption(source.pregnancyStatus, 'pregnancyStatus'),
    previousTreatments: requireText(source.previousTreatments, MAXIMUM_LONG_TEXT),
    sunExposure: requireOption(source.sunExposure, 'sunExposure'),
    tobacco: requireOption(source.tobacco, 'tobacco'),
    waterGlasses: requireInteger(source.waterGlasses, 30)
  };
};

// Normaliza condiciones que requieren precaución
export const normalizePrecautions = (source) => {
  const fields = ['hasNoKnownConditions', 'conditions', 'bloodPressureNotes', 'skinConditionNotes', 'otherConditions'];
  requireExactFields(source, fields, 'Las precauciones');

  if (typeof source.hasNoKnownConditions !== 'boolean') {
    failClinicalRecord('invalid-argument', 'La declaración de condiciones no es válida');
  }

  const conditions = requireOptions(source.conditions, 'precautions');

  if (source.hasNoKnownConditions && conditions.length > 0) {
    failClinicalRecord('invalid-argument', 'Las condiciones declaradas se contradicen');
  }

  return {
    bloodPressureNotes: requireText(source.bloodPressureNotes, 500),
    conditions,
    hasNoKnownConditions: source.hasNoKnownConditions,
    otherConditions: requireText(source.otherConditions, 1000),
    skinConditionNotes: requireText(source.skinConditionNotes, 1000)
  };
};

// Normaliza el análisis estético
export const normalizeSkinAnalysis = (source) => {
  const fields = ['coloration', 'texture', 'shine', 'pores', 'hydration', 'sebum', 'lesions', 'acneFactors', 'acneNotes', 'pigmentation', 'phototype', 'vascularization', 'muscleTone', 'wrinkles', 'flaccidity', 'eyeArea', 'scars', 'skinTypes', 'surfaceObservations', 'aestheticAssessment', 'treatmentRationale'];
  requireExactFields(source, fields, 'El análisis de piel');

  return {
    acneFactors: requireOptions(source.acneFactors, 'acneFactors'),
    acneNotes: requireText(source.acneNotes, 1000),
    aestheticAssessment: requireText(source.aestheticAssessment, MAXIMUM_LONG_TEXT),
    coloration: requireOption(source.coloration, 'coloration'),
    eyeArea: requireOptions(source.eyeArea, 'eyeArea'),
    flaccidity: requireOptions(source.flaccidity, 'flaccidity'),
    hydration: requireOption(source.hydration, 'hydration'),
    lesions: requireOptions(source.lesions, 'lesions'),
    muscleTone: requireOption(source.muscleTone, 'muscleTone'),
    phototype: requireInteger(source.phototype, 6),
    pigmentation: requireOptions(source.pigmentation, 'pigmentation'),
    pores: requireOptions(source.pores, 'pores'),
    scars: requireOptions(source.scars, 'scars'),
    sebum: requireOption(source.sebum, 'sebum'),
    shine: requireOption(source.shine, 'shine'),
    skinTypes: requireOptions(source.skinTypes, 'skinTypes'),
    surfaceObservations: requireText(source.surfaceObservations, MAXIMUM_LONG_TEXT),
    texture: requireOptions(source.texture, 'texture'),
    treatmentRationale: requireText(source.treatmentRationale, MAXIMUM_LONG_TEXT),
    vascularization: requireOptions(source.vascularization, 'vascularization'),
    wrinkles: requireOptions(source.wrinkles, 'wrinkles')
  };
};

// Comprueba los campos mínimos de una ficha completa
export const requireCompletedRecord = (record) => {
  if (
    !record.personalDetails.birthDate
    || !record.history.generalHealth
    || !record.history.pregnancyStatus
    || !record.history.allergies
    || !record.history.medications
    || (!record.precautions.hasNoKnownConditions && record.precautions.conditions.length === 0)
    || !record.skinAnalysis.hydration
    || !record.skinAnalysis.sebum
    || record.skinAnalysis.skinTypes.length === 0
    || !record.skinAnalysis.aestheticAssessment
    || !record.skinAnalysis.treatmentRationale
  ) {
    failClinicalRecord('failed-precondition', 'Completa los campos indispensables antes de finalizar');
  }
};
