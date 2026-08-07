export const skinResultOptions = [
  { key: 'basica', label: 'Limpieza y mantenimiento' },
  { key: 'profunda', label: 'Limpieza profunda' },
  { key: 'acne', label: 'Control de imperfecciones' },
  { key: 'manchas', label: 'Cuidado de manchas' },
  { key: 'edad', label: 'Cuidado de signos de edad' }
];

const createOption = (id, label, resultKey, points, requiresContact = false) => ({
  id,
  label,
  points,
  requiresContact,
  resultKey
});

const defaultQuestions = [
  {
    id: 'sensacion-limpieza',
    text: '¿Cómo sientes tu piel después de limpiarla?',
    options: [
      createOption('tirante', 'Tirante o reseca', 'basica', 2),
      createOption('comoda', 'Cómoda', 'basica', 1),
      createOption('grasosa', 'Grasosa poco después', 'profunda', 2)
    ]
  },
  {
    id: 'brillo-diario',
    text: '¿En qué zona notas brillo durante el día?',
    options: [
      createOption('sin-brillo', 'Casi no tengo brillo', 'basica', 1),
      createOption('zona-t', 'Principalmente frente nariz y barbilla', 'profunda', 2),
      createOption('todo-rostro', 'En casi todo el rostro', 'profunda', 3)
    ]
  },
  {
    id: 'imperfecciones',
    text: '¿Con qué frecuencia aparecen granitos o poros obstruidos?',
    options: [
      createOption('rara-vez', 'Rara vez', 'basica', 1),
      createOption('algunas-veces', 'Algunas veces', 'acne', 2),
      createOption('frecuente', 'Frecuentemente', 'acne', 3)
    ]
  },
  {
    id: 'manchas',
    text: '¿Qué tanto te preocupan las manchas o el tono desigual?',
    options: [
      createOption('no-prioridad', 'No es mi prioridad', 'basica', 0),
      createOption('mejorar', 'Me gustaría mejorarlo', 'manchas', 2),
      createOption('principal', 'Es mi principal preocupación', 'manchas', 3)
    ]
  },
  {
    id: 'signos-edad',
    text: '¿Qué tanto te preocupan las líneas de expresión o la pérdida de firmeza?',
    options: [
      createOption('no-prioridad', 'No es mi prioridad', 'basica', 0),
      createOption('empiezo', 'Empiezo a notarlas', 'edad', 2),
      createOption('principal', 'Es mi principal preocupación', 'edad', 3)
    ]
  },
  {
    id: 'sensibilidad',
    text: '¿Tu piel presenta sensibilidad o irritación?',
    options: [
      createOption('rara-vez', 'Rara vez', 'basica', 0),
      createOption('algunos-productos', 'Algunos productos me causan molestias', 'basica', 1),
      createOption('intensa', 'Tengo irritación intensa o tratamiento dermatológico', 'basica', 0, true)
    ]
  },
  {
    id: 'objetivo',
    text: '¿Cuál es tu objetivo principal?',
    options: [
      createOption('limpieza', 'Limpieza y mantenimiento', 'basica', 3),
      createOption('imperfecciones', 'Controlar imperfecciones', 'acne', 3),
      createOption('manchas', 'Mejorar manchas', 'manchas', 3),
      createOption('edad', 'Cuidar signos de la edad', 'edad', 3)
    ]
  }
];

const defaultResults = {
  basica: {
    title: 'Cuidado esencial',
    summary: 'Tu piel puede beneficiarse de una limpieza suave y una rutina constante de cuidado facial.',
    serviceName: 'Limpieza facial básica'
  },
  profunda: {
    title: 'Limpieza profunda',
    summary: 'Tu piel puede beneficiarse de una limpieza enfocada en retirar impurezas y mejorar su apariencia.',
    serviceName: 'Limpieza facial profunda'
  },
  acne: {
    title: 'Cuidado de imperfecciones',
    summary: 'Tus respuestas muestran interés en controlar granitos poros obstruidos y exceso de grasa.',
    serviceName: 'Anti acné'
  },
  manchas: {
    title: 'Cuidado del tono',
    summary: 'Tus respuestas muestran interés en mejorar visualmente manchas y diferencias en el tono de la piel.',
    serviceName: 'Despigmentante'
  },
  edad: {
    title: 'Cuidado de signos de edad',
    summary: 'Tus respuestas muestran interés en cuidar la apariencia de líneas de expresión y firmeza.',
    serviceName: 'Anti edad'
  }
};

const normalizeName = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

// Crea el borrador recomendado con servicios reales
export const createRecommendedSkinTest = (services) => ({
  active: false,
  questions: defaultQuestions.map((question, index) => ({
    ...question,
    options: question.options.map((option) => ({ ...option })),
    order: index + 1
  })),
  results: Object.fromEntries(Object.entries(defaultResults).map(([key, result]) => {
    const service = services.find((item) => (
      normalizeName(item.name) === normalizeName(result.serviceName)
    ));
    return [key, {
      productIds: [],
      serviceId: service?.active ? service.id : '',
      summary: result.summary,
      title: result.title
    }];
  })),
  revision: 0
});
