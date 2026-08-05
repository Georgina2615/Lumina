// Construye un seguimiento vacío sin inventar observaciones
export const createEmptyClinicalSession = (scheduledTreatment = '') => ({
  afterObservations: '',
  beforeObservations: '',
  performedTreatment: scheduledTreatment,
  photoConsentGranted: false,
  photos: {
    afterPath: '',
    beforePath: ''
  }
});

// Convierte un documento real en el contrato del formulario
export const createClinicalSessionForm = (storedSession, scheduledTreatment = '') => ({
  ...createEmptyClinicalSession(scheduledTreatment),
  ...(storedSession ? {
    afterObservations: String(storedSession.afterObservations ?? ''),
    beforeObservations: String(storedSession.beforeObservations ?? ''),
    performedTreatment: String(
      storedSession.performedTreatment ?? scheduledTreatment
    ),
    photoConsentGranted: storedSession.photoConsentGranted === true,
    photos: {
      afterPath: String(storedSession.photos?.afterPath ?? ''),
      beforePath: String(storedSession.photos?.beforePath ?? '')
    }
  } : {})
});

// Devuelve el primer requisito pendiente al completar
export const getClinicalSessionCompletionError = ({ recordStatus, session }) => {
  if (recordStatus !== 'completed') {
    return 'Completa la ficha técnica antes de terminar el seguimiento';
  }
  if (!session.beforeObservations.trim()) {
    return 'Escribe las observaciones antes del tratamiento';
  }
  if (!session.performedTreatment.trim()) {
    return 'Escribe el tratamiento realizado';
  }
  if (!session.afterObservations.trim()) {
    return 'Escribe las observaciones después del tratamiento';
  }
  if (
    (session.photos.beforePath || session.photos.afterPath)
    && !session.photoConsentGranted
  ) {
    return 'Registra la autorización de fotografías';
  }

  return null;
};

// Convierte una sesión almacenada en información segura
export const mapClinicalSession = (id, data) => {
  if (
    typeof id !== 'string'
    || data?.schemaVersion !== 1
    || data?.appointmentId !== id
    || typeof data?.clientId !== 'string'
    || !Number.isSafeInteger(data?.revision)
  ) {
    return null;
  }

  return {
    afterObservations: String(data.afterObservations ?? ''),
    appointmentDate: String(data.appointmentDate ?? ''),
    appointmentId: id,
    beforeObservations: String(data.beforeObservations ?? ''),
    clientId: data.clientId,
    completedAt: data.completedAt ?? null,
    performedTreatment: String(data.performedTreatment ?? ''),
    photos: {
      afterPath: String(data.photos?.afterPath ?? ''),
      beforePath: String(data.photos?.beforePath ?? '')
    },
    previousTreatment: String(data.previousTreatment ?? ''),
    revision: data.revision,
    scheduledTime: String(data.scheduledTime ?? ''),
    scheduledTreatment: String(data.scheduledTreatment ?? ''),
    status: data.status === 'completed' ? 'completed' : 'draft',
    updatedAt: data.updatedAt ?? null
  };
};

// Ordena las sesiones desde la más reciente
export const sortClinicalSessions = (sessions) => [...sessions].sort(
  (first, second) => (
    `${second.appointmentDate}T${second.scheduledTime}`.localeCompare(
      `${first.appointmentDate}T${first.scheduledTime}`
    )
  )
);
