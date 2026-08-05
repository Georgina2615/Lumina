import { normalizeSearchText } from '../../../../shared/services/SearchPolicy.js';

// Convierte fechas de Firebase en valores comparables
export const getClinicalDateValue = (value) => {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsedDate = new Date(value).getTime();
    return Number.isNaN(parsedDate) ? 0 : parsedDate;
  }
  return 0;
};

// Une la identidad de la clienta con su ficha válida
export const mapClinicalDirectoryEntry = (clientSnapshot, recordsByClient) => {
  const client = clientSnapshot.data();
  const record = recordsByClient.get(clientSnapshot.id);
  const validRecord = record?.clientId === clientSnapshot.id
    && record?.schemaVersion === 1
    && Number.isSafeInteger(record?.revision)
    ? record
    : null;

  return {
    client: {
      consentSigned: client.consentimientoFirmado === true,
      email: typeof client.email === 'string' ? client.email : '',
      id: clientSnapshot.id,
      name: typeof client.nombreCompleto === 'string'
        ? client.nombreCompleto.trim()
        : 'Clienta sin nombre',
      phone: typeof client.telefono === 'string' ? client.telefono : ''
    },
    record: validRecord,
    revision: validRecord?.revision ?? 0,
    status: validRecord?.status === 'completed'
      ? 'completed'
      : validRecord ? 'draft' : 'missing',
    updatedAt: validRecord?.updatedAt ?? null
  };
};

// Ordena el directorio por nombre para facilitar su consulta
export const sortClinicalDirectory = (entries) => [...entries].sort(
  (first, second) => first.client.name.localeCompare(
    second.client.name,
    'es-MX',
    { sensitivity: 'base' }
  )
);

// Filtra por cualquier fragmento de nombre teléfono o correo
export const filterClinicalDirectory = (entries, search) => {
  const term = normalizeSearchText(search);
  if (!term) return entries;

  return entries.filter(({ client }) => normalizeSearchText([
    client.name,
    client.phone,
    client.email
  ].join(' ')).includes(term));
};

// Devuelve una fecha legible sin inventar información
export const formatClinicalUpdateDate = (value) => {
  const milliseconds = getClinicalDateValue(value);
  if (!milliseconds) return 'Sin cambios guardados';

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(milliseconds));
};
