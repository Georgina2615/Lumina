// Construye una ficha vacía con el contrato completo
export const createEmptyClinicalRecord = () => ({
  history: {
    alcohol: '',
    allergies: '',
    coffee: '',
    currentRoutine: '',
    diet: '',
    digestion: '',
    generalHealth: '',
    medications: '',
    pregnancyStatus: '',
    previousTreatments: '',
    sunExposure: '',
    tobacco: '',
    waterGlasses: 0
  },
  personalDetails: {
    address: '',
    birthDate: '',
    cesareans: 0,
    hysterectomy: false,
    occupation: '',
    otherProcedures: '',
    pregnancies: 0,
    surgeries: ''
  },
  precautions: {
    bloodPressureNotes: '',
    conditions: [],
    hasNoKnownConditions: false,
    otherConditions: '',
    skinConditionNotes: ''
  },
  skinAnalysis: {
    acneFactors: [],
    acneNotes: '',
    aestheticAssessment: '',
    coloration: '',
    eyeArea: [],
    flaccidity: [],
    hydration: '',
    lesions: [],
    muscleTone: '',
    phototype: 0,
    pigmentation: [],
    pores: [],
    scars: [],
    sebum: '',
    shine: '',
    skinTypes: [],
    surfaceObservations: '',
    texture: [],
    treatmentRationale: '',
    vascularization: [],
    wrinkles: []
  }
});

// Combina una ficha guardada con el contrato vigente
export const createClinicalRecordForm = (storedRecord) => {
  const emptyRecord = createEmptyClinicalRecord();

  if (!storedRecord) return emptyRecord;

  return {
    history: { ...emptyRecord.history, ...storedRecord.history },
    personalDetails: {
      ...emptyRecord.personalDetails,
      ...storedRecord.personalDetails
    },
    precautions: {
      ...emptyRecord.precautions,
      ...storedRecord.precautions
    },
    skinAnalysis: {
      ...emptyRecord.skinAnalysis,
      ...storedRecord.skinAnalysis
    }
  };
};

// Devuelve el primer requisito pendiente para completar
export const getClinicalCompletionError = (record) => {
  if (!record.history.generalHealth) return 'Selecciona el estado general de salud';
  if (!record.history.pregnancyStatus) return 'Indica si existe embarazo o lactancia';
  if (!record.history.allergies.trim()) return 'Escribe las alergias o indica Ninguna';
  if (!record.history.medications.trim()) return 'Escribe los medicamentos o indica Ninguno';

  if (
    !record.precautions.hasNoKnownConditions
    && record.precautions.conditions.length === 0
  ) {
    return 'Indica las condiciones conocidas o selecciona Ninguna';
  }

  if (!record.skinAnalysis.hydration) return 'Selecciona el grado de hidratación';
  if (!record.skinAnalysis.sebum) return 'Selecciona la secreción sebácea';
  if (record.skinAnalysis.skinTypes.length === 0) return 'Selecciona al menos un tipo de piel';
  if (!record.skinAnalysis.aestheticAssessment.trim()) return 'Escribe la evaluación estética';
  if (!record.skinAnalysis.treatmentRationale.trim()) return 'Explica el tratamiento recomendado';

  return null;
};
