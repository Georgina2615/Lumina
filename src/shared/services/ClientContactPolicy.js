// Define el formato permitido para nombres reales
const clientNamePattern = new RegExp(
  "^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '’\\-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$",
  'u'
);

// Normaliza un nombre completo
export const normalizeClientFullName = (value) => {
  const normalized = String(value ?? '')
    .normalize('NFC')
    .trim()
    .replace(/\s+/g, ' ');
  if (normalized.length < 2 || normalized.length > 150) {
    throw new Error('Escribe el nombre completo');
  }
  if (!clientNamePattern.test(normalized)) {
    throw new Error('El nombre solo puede contener letras espacios apóstrofes y guiones');
  }
  return normalized;
};

// Normaliza un telefono nacional
export const normalizeClientPhone = (value) => {
  const normalized = String(value ?? '').replace(/\D/g, '');
  if (!/^\d{10}$/.test(normalized)) {
    throw new Error('El teléfono debe tener diez dígitos');
  }
  return normalized;
};

// Normaliza un correo electronico
export const normalizeClientEmail = (value, { required = false } = {}) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized && !required) return '';
  if (
    !normalized
    || normalized.length > 254
    || normalized.includes('/')
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new Error('Escribe un correo electrónico válido');
  }
  return normalized;
};
