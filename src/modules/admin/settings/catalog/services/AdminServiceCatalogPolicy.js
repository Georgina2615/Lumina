const currencyFormatter = new Intl.NumberFormat('es-MX', {
  currency: 'MXN',
  style: 'currency'
});

// Define los caracteres comerciales aceptados
const serviceNamePattern = /^[\p{L}\p{M}\p{N} .,'’:/&+%°()#-]+$/u;

// Define el precio maximo permitido
const maximumServicePriceCents = 100_000_000;

// Expone la politica fija vigente
export const servicePolicy = Object.freeze({
  blockDurationMinutes: 180,
  depositPercentage: 30,
  preparationMinutes: 30,
  serviceDurationMinutes: 150
});

// Verifica un documento antes de mostrarlo en la agenda
export const isServiceCatalogDocumentValid = (data) => {
  const rawName = typeof data?.nombre === 'string' ? data.nombre : '';
  const name = rawName.trim().replace(/\s+/g, ' ');
  const description = data?.descripcionPublica ?? '';

  return rawName === name
    && name.length >= 2
    && name.length <= 120
    && /\p{L}/u.test(name)
    && serviceNamePattern.test(name)
    && typeof description === 'string'
    && description === description.trim()
    && description.length <= 500
    && Number.isSafeInteger(data?.precioCentavos)
    && data.precioCentavos > 0
    && data.precioCentavos <= maximumServicePriceCents
    && Number.isSafeInteger(data?.orden)
    && data.orden >= 1
    && data.orden <= 999
    && data.duracionServicioMinutos === servicePolicy.serviceDurationMinutes
    && data.tiempoPreparacionMinutos === servicePolicy.preparationMinutes
    && data.duracionBloqueMinutos === servicePolicy.blockDurationMinutes
    && data.porcentajeAnticipo === servicePolicy.depositPercentage;
};

// Formatea un precio real del catalogo
export const formatServicePrice = (priceCents) => (
  Number.isSafeInteger(priceCents) && priceCents > 0
    ? currencyFormatter.format(priceCents / 100)
    : 'Precio pendiente'
);

// Convierte pesos visibles en centavos seguros
export const parseServicePriceCents = (value) => {
  const cents = Math.round(Number(value) * 100);

  return Number.isSafeInteger(cents)
    && cents > 0
    && cents <= maximumServicePriceCents
    ? cents
    : null;
};

// Construye el estado inicial del formulario
export const createServiceFormState = (service = null) => ({
  name: service?.name ?? '',
  publicDescription: service?.publicDescription ?? '',
  price: service?.priceCents ? String(service.priceCents / 100) : ''
});

// Valida el formulario antes de contactar al servidor
export const validateServiceForm = (form) => {
  const name = form.name.trim().replace(/\s+/g, ' ');

  if (
    name.length < 2
    || name.length > 120
    || !/\p{L}/u.test(name)
    || !serviceNamePattern.test(name)
  ) {
    return 'Escribe un nombre de servicio válido';
  }

  if (form.publicDescription.trim().length > 500) {
    return 'La descripción no puede superar quinientos caracteres';
  }

  if (parseServicePriceCents(form.price) === null) {
    return 'Escribe un precio válido';
  }

  return null;
};

// Traduce el formulario al contrato seguro
export const buildServiceCommand = (form) => ({
  name: form.name.trim().replace(/\s+/g, ' '),
  publicDescription: form.publicDescription.trim(),
  priceCents: parseServicePriceCents(form.price)
});

// Devuelve una identidad unica para cada operacion
export const createServiceOperationId = () => (
  globalThis.crypto.randomUUID()
);
