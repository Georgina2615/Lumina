// Representa un error controlado de seguimiento clínico
export class ClinicalSessionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'ClinicalSessionError';
  }
}

// Detiene una operación clínica con un mensaje seguro
export const failClinicalSession = (code, message) => {
  throw new ClinicalSessionError(code, message);
};

// Exige un objeto con las propiedades esperadas
export const requireExactObject = (value, fields, label) => {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};

  if (
    Object.keys(source).length !== fields.length
    || fields.some((field) => !Object.hasOwn(source, field))
  ) {
    failClinicalSession('invalid-argument', `${label} contiene información no permitida`);
  }

  return source;
};

// Normaliza un identificador documental
export const requireClinicalSessionIdentifier = (value, label) => {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (!/^[A-Za-z0-9_-]{3,128}$/.test(normalized)) {
    failClinicalSession('invalid-argument', `${label} no es válido`);
  }

  return normalized;
};

// Normaliza texto limitado del seguimiento
export const normalizeClinicalSessionText = (value, label, maximum, required = false) => {
  const normalized = typeof value === 'string' ? value.trim() : '';

  if (
    normalized.length > maximum
    || (required && normalized.length === 0)
  ) {
    failClinicalSession(
      'invalid-argument',
      required ? `${label} es obligatorio` : `${label} es demasiado extenso`
    );
  }

  return normalized;
};

// Valida una revisión optimista
export const requireClinicalSessionRevision = (value) => {
  if (!Number.isSafeInteger(value) || value < 0) {
    failClinicalSession('invalid-argument', 'La revisión no es válida');
  }

  return value;
};

// Valida una ruta privada y determinista
const normalizePhotoPath = ({ appointmentId, clientId, kind, value }) => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  const expectedPath = `sesiones-clinicas/${clientId}/${appointmentId}/${kind}.webp`;

  if (normalized && normalized !== expectedPath) {
    failClinicalSession('invalid-argument', 'La ruta de fotografía no es válida');
  }

  return normalized;
};

// Normaliza las fotografías privadas de la sesión
export const normalizeClinicalSessionPhotos = ({ appointmentId, clientId, source }) => {
  const photos = requireExactObject(
    source,
    ['afterPath', 'beforePath'],
    'Las fotografías'
  );

  return {
    afterPath: normalizePhotoPath({
      appointmentId,
      clientId,
      kind: 'after',
      value: photos.afterPath
    }),
    beforePath: normalizePhotoPath({
      appointmentId,
      clientId,
      kind: 'before',
      value: photos.beforePath
    })
  };
};

// Exige las respuestas necesarias para terminar una sesión
export const requireCompletedClinicalSession = (session) => {
  normalizeClinicalSessionText(
    session.beforeObservations,
    'Las observaciones iniciales',
    2000,
    true
  );
  normalizeClinicalSessionText(
    session.performedTreatment,
    'El tratamiento realizado',
    1000,
    true
  );
  normalizeClinicalSessionText(
    session.afterObservations,
    'Las observaciones finales',
    2000,
    true
  );
};
