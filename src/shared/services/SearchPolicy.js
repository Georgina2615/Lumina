// Normaliza texto para búsquedas parciales sin distinguir acentos
export const normalizeSearchText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('es-MX');
